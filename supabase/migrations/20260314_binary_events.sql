-- =========================================================
-- Adiciona suporte a eventos binarios (SIM/NAO) sem alternativas
-- =========================================================

-- 1) Nova coluna event_type: 'binary' ou 'multiple'
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'multiple';

-- 2) Nova coluna winner_choice: para eventos binarios, guarda se o resultado foi 'sim' ou 'nao'
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS winner_choice text;

-- 3) Atualiza resolve_event para aceitar winner_choice
--    - Multi-option: usa logica existente (winner_option_id = opcao vencedora, SIM nela ganha)
--    - Binary: usa winner_choice para determinar se SIM ou NAO foi o resultado correto
DROP FUNCTION IF EXISTS public.resolve_event(uuid, uuid);

CREATE OR REPLACE FUNCTION public.resolve_event(
  p_event_id uuid,
  p_winner_option_id uuid,
  p_winner_choice text DEFAULT 'sim'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%rowtype;
  v_winner_option public.event_options%rowtype;
  v_bet record;
  v_is_winner boolean;
  v_option_label text;
  v_total_pot bigint := 0;
  v_winners_total bigint := 0;
  v_winners_count integer := 0;
  v_losers_count integer := 0;
  v_rake_amount bigint := 0;
  v_net_pot bigint := 0;
  v_payout bigint := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  IF p_winner_choice NOT IN ('sim', 'nao') THEN
    RAISE EXCEPTION 'winner_choice must be sim or nao.';
  END IF;

  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found.';
  END IF;

  IF v_event.status <> 'open' THEN
    RAISE EXCEPTION 'Event is not open.';
  END IF;

  SELECT *
  INTO v_winner_option
  FROM public.event_options
  WHERE id = p_winner_option_id
    AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Winner option not found for this event.';
  END IF;

  -- Primeira passada: calcular totais
  FOR v_bet IN
    SELECT *
    FROM public.bets
    WHERE event_id = p_event_id
      AND status = 'pending'
    FOR UPDATE
  LOOP
    v_total_pot := v_total_pot + COALESCE(v_bet.amount, 0);

    IF p_winner_choice = 'sim' THEN
      -- Multi-option ou binario com resultado SIM
      v_is_winner := (
        (v_bet.option_id = p_winner_option_id AND v_bet.choice = 'sim')
        OR
        (v_bet.option_id <> p_winner_option_id AND v_bet.choice = 'nao')
      );
    ELSE
      -- Binario com resultado NAO
      v_is_winner := (
        (v_bet.option_id = p_winner_option_id AND v_bet.choice = 'nao')
        OR
        (v_bet.option_id <> p_winner_option_id AND v_bet.choice = 'sim')
      );
    END IF;

    IF v_is_winner THEN
      v_winners_total := v_winners_total + COALESCE(v_bet.amount, 0);
      v_winners_count := v_winners_count + 1;
    ELSE
      v_losers_count := v_losers_count + 1;
    END IF;
  END LOOP;

  -- Sem apostas: resolver sem pagar
  IF v_total_pot = 0 THEN
    UPDATE public.events
    SET status = 'resolved',
        winner_option_id = p_winner_option_id,
        winner_choice = p_winner_choice,
        resolved_at = now()
    WHERE id = p_event_id;

    RETURN jsonb_build_object(
      'resolved', true,
      'winnersCount', 0,
      'losersCount', 0,
      'totalPot', 0,
      'rakeAmount', 0,
      'netPot', 0
    );
  END IF;

  -- Rake de 5%
  v_rake_amount := floor(v_total_pot * 0.05);
  v_net_pot := v_total_pot - v_rake_amount;

  PERFORM set_config('app.bypass_economy_guard', '1', true);

  -- Segunda passada: pagar/marcar bets
  FOR v_bet IN
    SELECT *
    FROM public.bets
    WHERE event_id = p_event_id
      AND status = 'pending'
    FOR UPDATE
  LOOP
    IF p_winner_choice = 'sim' THEN
      v_is_winner := (
        (v_bet.option_id = p_winner_option_id AND v_bet.choice = 'sim')
        OR
        (v_bet.option_id <> p_winner_option_id AND v_bet.choice = 'nao')
      );
    ELSE
      v_is_winner := (
        (v_bet.option_id = p_winner_option_id AND v_bet.choice = 'nao')
        OR
        (v_bet.option_id <> p_winner_option_id AND v_bet.choice = 'sim')
      );
    END IF;

    SELECT eo.label
    INTO v_option_label
    FROM public.event_options eo
    WHERE eo.id = v_bet.option_id;

    IF v_is_winner THEN
      IF v_winners_total > 0 THEN
        v_payout := floor(v_net_pot::numeric * (v_bet.amount::numeric / v_winners_total::numeric));
      ELSE
        v_payout := 0;
      END IF;

      UPDATE public.bets
      SET status = 'won', payout = v_payout, resolved_at = now()
      WHERE id = v_bet.id;

      UPDATE public.users
      SET
        coins = coins + v_payout,
        xp = xp + 25
      WHERE id = v_bet.user_id;

      INSERT INTO public.transactions (
        user_id, type, amount, currency, description, related_id
      ) VALUES (
        v_bet.user_id,
        'bet_won',
        v_payout,
        'coin',
        format(
          'Acertou e ganhou %s Q$ no evento "%s" (opcao: %s)',
          v_payout,
          v_event.title,
          COALESCE(v_option_label, 'N/D')
        ),
        p_event_id
      );
    ELSE
      UPDATE public.bets
      SET status = 'lost', payout = 0, resolved_at = now()
      WHERE id = v_bet.id;

      UPDATE public.users
      SET xp = xp + 10
      WHERE id = v_bet.user_id;
    END IF;
  END LOOP;

  UPDATE public.events
  SET status = 'resolved',
      winner_option_id = p_winner_option_id,
      winner_choice = p_winner_choice,
      resolved_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'resolved', true,
    'winnerOptionId', p_winner_option_id,
    'winnerChoice', p_winner_choice,
    'winnersCount', v_winners_count,
    'losersCount', v_losers_count,
    'totalPot', v_total_pot,
    'rakeAmount', v_rake_amount,
    'netPot', v_net_pot
  );
END;
$$;

-- Atualizar grant para nova assinatura
GRANT EXECUTE ON FUNCTION public.resolve_event(uuid, uuid, text) TO authenticated;
