-- This file is autogenerated from regen-schema.ts
create table if not exists
  user_contract_metrics (
    user_id text not null,
    contract_id text not null,
    data jsonb not null,
    has_yes_shares boolean,
    has_no_shares boolean,
    total_shares_yes numeric,
    total_shares_no numeric,
    profit numeric,
    has_shares boolean,
    answer_id text,
    id bigint generated always as identity,
    profit_adjustment numeric
  );

-- Row Level Security
alter table user_contract_metrics enable row level security;

-- Policies
drop policy if exists "public read" on user_contract_metrics;

create policy "public read" on user_contract_metrics for
select
  using (true);

drop policy if exists "read for admin" on user_contract_metrics;

create policy "read for admin" on user_contract_metrics for
select
  to service_role using (true);

-- Indexes
drop index if exists user_contract_metrics_pkey;

create unique index user_contract_metrics_pkey on public.user_contract_metrics using btree (id);

drop index if exists contract_metrics_answer_id;

create index contract_metrics_answer_id on public.user_contract_metrics using btree (contract_id, answer_id);

drop index if exists idx_user_contract_metrics_contract_profit;

create index idx_user_contract_metrics_contract_profit on public.user_contract_metrics using btree (contract_id, profit);

drop index if exists unique_user_contract_answer;

create unique index unique_user_contract_answer on public.user_contract_metrics using btree (
  user_id,
  contract_id,
  coalesce(answer_id, ''::text)
);

drop index if exists user_contract_metrics_recent_bets;

create index user_contract_metrics_recent_bets on public.user_contract_metrics using btree (
  user_id,
  (((data -> 'lastBetTime'::text))::bigint) desc
);

create
or replace function update_null_answer_metrics () returns trigger as $$
DECLARE
    sum_has_yes_shares BOOLEAN := FALSE;
    sum_has_no_shares BOOLEAN := FALSE;
    sum_has_shares BOOLEAN := FALSE;
BEGIN
    -- Check if the new row has a non-null answer_id
    IF NEW.answer_id IS NOT NULL THEN
        -- Aggregate boolean fields from rows with the same user_id and contract_id
        SELECT
            BOOL_OR(has_yes_shares),
            BOOL_OR(has_no_shares),
            BOOL_OR(has_shares)
        INTO
            sum_has_yes_shares,
            sum_has_no_shares,
            sum_has_shares
        FROM user_contract_metrics
        WHERE user_id = NEW.user_id
          AND contract_id = NEW.contract_id
          AND answer_id IS NOT NULL;
        -- Update the row where answer_id is null with the aggregated metrics
        UPDATE user_contract_metrics
        SET
            has_yes_shares = sum_has_yes_shares,
            has_no_shares = sum_has_no_shares,
            has_shares = sum_has_shares
        WHERE user_id = NEW.user_id
          AND contract_id = NEW.contract_id
          AND answer_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ language plpgsql;

create
or replace trigger update_null_answer_metrics_trigger
after insert
or
update on user_contract_metrics for each row
execute function update_null_answer_metrics ();
