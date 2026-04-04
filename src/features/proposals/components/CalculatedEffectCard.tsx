import type {
  ActionType,
  UseSkillEffect,
  UseMagicEffect,
  ChargeMagicEffect,
  RegainGnosisEffect,
  RestEffect,
  WorkOnProjectEffect,
  NewTraitEffect,
  NewBondEffect,
} from "@/lib/api/types";

interface CalculatedEffectCardProps {
  actionType: ActionType;
  calculatedEffect: Record<string, unknown>;
  className?: string;
}

/**
 * CalculatedEffectCard — displays the server-computed effects of a proposal.
 *
 * Renders a summary of dice pools, resource costs, and other mechanical
 * consequences. Used on:
 *   - Proposal detail page (approved proposals)
 *   - Proposal list (approved cards)
 *   - Wizard Step 3 (review before submit)
 */
export function CalculatedEffectCard({
  actionType,
  calculatedEffect,
  className = "",
}: CalculatedEffectCardProps) {
  return (
    <div
      className={`
        rounded-lg border border-border-default bg-bg-elevated p-4
        ${className}
      `}
      aria-label="Calculated effect"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Calculated Effect
      </h4>
      <EffectBody actionType={actionType} effect={calculatedEffect} />
    </div>
  );
}

// ── Internal renderers by action type ─────────────────────────────

function EffectBody({
  actionType,
  effect,
}: {
  actionType: ActionType;
  effect: Record<string, unknown>;
}) {
  switch (actionType) {
    case "use_skill":
      return <UseSkillBody effect={effect as unknown as UseSkillEffect} />;
    case "use_magic":
      return <UseMagicBody effect={effect as unknown as UseMagicEffect} />;
    case "charge_magic":
      return <ChargeMagicBody effect={effect as unknown as ChargeMagicEffect} />;
    case "regain_gnosis":
      return <RegainGnosisBody effect={effect as unknown as RegainGnosisEffect} />;
    case "rest":
      return <RestBody effect={effect as unknown as RestEffect} />;
    case "work_on_project":
      return <WorkOnProjectBody effect={effect as unknown as WorkOnProjectEffect} />;
    case "new_trait":
      return <NewTraitBody effect={effect as unknown as NewTraitEffect} />;
    case "new_bond":
      return <NewBondBody effect={effect as unknown as NewBondEffect} />;
    default:
      return (
        <p className="text-sm text-text-secondary italic">
          No calculated effect for this action type.
        </p>
      );
  }
}

// ── Shared sub-components ─────────────────────────────────────────

function DicePool({ pool }: { pool: number }) {
  return (
    <div className="flex items-baseline gap-1.5 mb-3">
      <span className="text-2xl font-bold tabular-nums text-text-primary">
        {pool}
      </span>
      <span className="text-sm text-text-secondary">dice</span>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

function CostsSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t border-border-default space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
        Costs
      </p>
      {children}
    </div>
  );
}

function ModifierList({
  modifiers,
}: {
  modifiers: Array<{ id?: string; name: string; type: string; bonus: number }>;
}) {
  if (modifiers.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs text-text-secondary mb-1">Modifiers</p>
      <ul className="space-y-0.5">
        {modifiers.map((mod, i) => (
          <li key={mod.id ?? i} className="text-sm text-text-primary flex items-center gap-1.5">
            <span className="text-text-secondary text-xs capitalize">
              {mod.type.replace(/_/g, " ")}
            </span>
            <span className="font-medium">{mod.name}</span>
            <span className="text-text-secondary text-xs">+{mod.bonus}d</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Action-specific renderers ─────────────────────────────────────

function UseSkillBody({ effect }: { effect: UseSkillEffect }) {
  const traitChargeCosts = effect.costs?.trait_charges ?? [];
  return (
    <div>
      <DicePool pool={effect.dice_pool} />
      <div className="text-sm text-text-secondary space-y-0.5">
        <span className="capitalize">{effect.skill}</span>
        <span className="text-text-secondary/50"> lv{effect.skill_level}</span>
      </div>
      <ModifierList modifiers={(effect.modifiers ?? []) as Array<{ id?: string; name: string; type: string; bonus: number }>} />
      <CostsSection>
        {effect.costs?.plot > 0 && (
          <CostRow label="Plot" value={`-${effect.costs.plot}`} />
        )}
        {traitChargeCosts.map((tc) => (
          <CostRow
            key={tc.trait_id}
            label={`Trait charge (${tc.trait_id.slice(-6)})`}
            value={`-${tc.cost}`}
          />
        ))}
        {effect.costs?.plot === 0 && traitChargeCosts.length === 0 && (
          <p className="text-sm text-text-secondary italic">No resource costs.</p>
        )}
      </CostsSection>
    </div>
  );
}

function UseMagicBody({ effect }: { effect: UseMagicEffect }) {
  const costs = effect.costs ?? {};
  const traitChargeCosts = costs.trait_charges ?? [];
  const bondSacrifices = costs.bond_sacrifices ?? [];
  const traitSacrifices = costs.trait_sacrifices ?? [];

  return (
    <div>
      <DicePool pool={effect.dice_pool} />
      <div className="text-sm text-text-secondary mb-2">
        <span className="capitalize">{effect.suggested_stat}</span>
        <span className="text-text-secondary/50"> lv{effect.stat_level}</span>
        {" + "}
        <span>{effect.sacrifice_dice} sacrifice dice</span>
        {" · "}
        <span>{effect.total_gnosis_equivalent} gnosis eq.</span>
      </div>
      <ModifierList modifiers={(effect.modifiers ?? []) as Array<{ id?: string; name: string; type: string; bonus: number }>} />
      <CostsSection>
        {costs.gnosis > 0 && <CostRow label="Gnosis" value={`-${costs.gnosis}`} />}
        {costs.stress > 0 && <CostRow label="Stress" value={`+${costs.stress}`} />}
        {costs.free_time > 0 && <CostRow label="Free Time" value={`-${costs.free_time}`} />}
        {costs.plot > 0 && <CostRow label="Plot" value={`-${costs.plot}`} />}
        {traitChargeCosts.map((tc) => (
          <CostRow key={tc.trait_id} label={`Trait charge`} value={`-1`} />
        ))}
        {bondSacrifices.map((b: { bond_id: string; name: string }) => (
          <CostRow key={b.bond_id} label={`Bond retired`} value={b.name} />
        ))}
        {traitSacrifices.map((t: { trait_id: string; name: string }) => (
          <CostRow key={t.trait_id} label={`Trait retired`} value={t.name} />
        ))}
        {costs.gnosis === 0 &&
          costs.stress === 0 &&
          costs.free_time === 0 &&
          costs.plot === 0 &&
          traitChargeCosts.length === 0 &&
          bondSacrifices.length === 0 &&
          traitSacrifices.length === 0 && (
            <p className="text-sm text-text-secondary italic">No resource costs.</p>
          )}
      </CostsSection>
    </div>
  );
}

function ChargeMagicBody({ effect }: { effect: ChargeMagicEffect }) {
  const target = effect.target_effect;
  return (
    <div>
      {target && (
        <div className="mb-3 p-2 rounded-md bg-bg-surface border border-border-default">
          <p className="text-xs text-text-secondary">Target effect</p>
          <p className="text-sm font-medium text-text-primary">{target.name}</p>
          {target.charges_current !== null && (
            <p className="text-xs text-text-secondary">
              {target.charges_current}/{target.charges_max} charges
            </p>
          )}
        </div>
      )}
      <UseMagicBody effect={effect} />
    </div>
  );
}

function RegainGnosisBody({ effect }: { effect: RegainGnosisEffect }) {
  const traitChargeCosts = effect.costs?.trait_charges ?? [];
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold tabular-nums text-meter-gnosis">
          +{effect.gnosis_gained}
        </span>
        <span className="text-sm text-text-secondary">Gnosis</span>
      </div>
      <CostsSection>
        <CostRow label="Free Time" value="-1" />
        {traitChargeCosts.map((tc) => (
          <CostRow key={tc.trait_id} label="Trait charge" value="-1" />
        ))}
      </CostsSection>
    </div>
  );
}

function RestBody({ effect }: { effect: RestEffect }) {
  const traitChargeCosts = effect.costs?.trait_charges ?? [];
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold tabular-nums text-meter-stress">
          -{effect.stress_healed}
        </span>
        <span className="text-sm text-text-secondary">Stress</span>
      </div>
      <CostsSection>
        <CostRow label="Free Time" value="-1" />
        {traitChargeCosts.map((tc) => (
          <CostRow key={tc.trait_id} label="Trait charge" value="-1" />
        ))}
      </CostsSection>
    </div>
  );
}

function WorkOnProjectBody({ effect }: { effect: WorkOnProjectEffect }) {
  return (
    <div>
      {effect.entry_text && (
        <p className="text-sm text-text-primary mb-3 italic">
          &ldquo;{effect.entry_text}&rdquo;
        </p>
      )}
      <CostsSection>
        <CostRow label="Free Time" value="-1" />
      </CostsSection>
    </div>
  );
}

function NewTraitBody({ effect }: { effect: NewTraitEffect }) {
  const slotLabel =
    effect.slot_type === "core_trait" ? "Core Trait" : "Role Trait";
  return (
    <div>
      <div className="mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy-light text-text-secondary">
          {slotLabel}
        </span>
      </div>
      {effect.proposed_name && (
        <p className="text-sm font-medium text-text-primary mb-1">
          {effect.proposed_name}
        </p>
      )}
      {effect.proposed_description && (
        <p className="text-sm text-text-secondary mb-2">{effect.proposed_description}</p>
      )}
      {effect.retire_trait_id && (
        <p className="text-xs text-text-secondary">
          Retires trait: <span className="font-mono">{effect.retire_trait_id.slice(-8)}</span>
        </p>
      )}
      <CostsSection>
        <CostRow label="Free Time" value="-1" />
      </CostsSection>
    </div>
  );
}

function NewBondBody({ effect }: { effect: NewBondEffect }) {
  return (
    <div>
      <div className="mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy-light text-text-secondary capitalize">
          {effect.target_type} bond
        </span>
      </div>
      {effect.retire_bond_id && (
        <p className="text-xs text-text-secondary mb-2">
          Retires bond: <span className="font-mono">{effect.retire_bond_id.slice(-8)}</span>
        </p>
      )}
      <CostsSection>
        <CostRow label="Free Time" value="-1" />
      </CostsSection>
    </div>
  );
}
