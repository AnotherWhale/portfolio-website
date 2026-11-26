import katex from "katex";
import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import "katex/dist/katex.min.css";
import { annotateFormula } from "./equationSymbols";
import { formulation, notation, replayObjective, replayTranslation, type FormulaTranslation, type NotationKey } from "./modelFormulation";

const notationKeys = Object.keys(notation) as NotationKey[];

const MathFormula = memo(function MathFormula({ latex, display = false, linked = false }: {
  latex: string;
  display?: boolean;
  linked?: boolean;
}) {
  const html = katex.renderToString(linked ? annotateFormula(latex).marked : latex, {
    displayMode: display,
    strict: (code) => code === "htmlExtension" ? "ignore" : "warn",
    trust: (context) => linked && context.command === "\\htmlData"
      && Object.hasOwn(notation, context.attributes["data-equation-symbol"]),
  });
  return display
    ? <div className="routing-equation-formula" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />;
});

type EquationEntry = typeof formulation[number]["equations"][number];

function PlainLanguage({ translation, label }: { translation: FormulaTranslation; label: string }) {
  const paragraphs = typeof translation === "string" ? [translation] : translation;
  return (
    <details className="routing-equation-translation">
      <summary aria-label={`Plain-language translation for ${label}`}>Plain-language translation</summary>
      <div>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>
            {paragraph.split("$").map((part, index) => index % 2
              ? <MathFormula key={index} latex={part} linked />
              : part)}
          </p>
        ))}
      </div>
    </details>
  );
}

function EquationList({ equations }: { equations: readonly EquationEntry[] }) {
  return (
    <ol className="routing-equations" start={equations[0][0]}>
      {equations.map(([number, explanation, latex, translation, condition]) => (
        <li className="routing-equation" key={number} value={number}>
          <span className="routing-equation-number" aria-label={`Equation ${number}`}>({number})</span>
          <div className="routing-equation-body">
            <p>{explanation}</p>
            <MathFormula latex={latex} display linked />
            {condition && <p className="routing-equation-condition"><MathFormula latex={condition} linked /></p>}
            <PlainLanguage translation={translation} label={`equation ${number}`} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function NotationList({ symbols, selected, onSelect }: {
  symbols: ReadonlySet<NotationKey>;
  selected: NotationKey | null;
  onSelect: (key: NotationKey) => void;
}) {
  const id = useId();
  return (
    <dl className="routing-notation">
      {notationKeys.filter((key) => symbols.has(key)).map((key) => {
        const [latex, meaning] = notation[key];
        return (
          <div key={key} data-symbol-definition={key}>
            <dt>
              <button type="button" data-equation-symbol={key} aria-pressed={selected === key}
                aria-describedby={`${id}-${key}`} onClick={() => onSelect(key)}>
                <MathFormula latex={latex} />
              </button>
            </dt>
            <dd id={`${id}-${key}`}>{meaning}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function getSymbol(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-equation-symbol]")?.dataset.equationSymbol as NotationKey | undefined
    : undefined;
}

function getTranslationDisclosures(panel: HTMLDivElement | null) {
  return [...(panel?.querySelectorAll<HTMLDetailsElement>(".routing-equation-translation") ?? [])];
}

function EquationPanel({ formulas, children, allowBulkTranslations = false }: {
  formulas: readonly string[];
  children: ReactNode;
  allowBulkTranslations?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const glossary = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<NotationKey | null>(null);
  const [focused, setFocused] = useState<NotationKey | null>(null);
  const [selected, setSelected] = useState<NotationKey | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const active = hovered ?? focused ?? selected;
  const activeDefinition = active && notation[active];
  const symbols = useMemo(() => new Set(formulas.flatMap((latex) => [...annotateFormula(latex).symbols])), [formulas]);

  useEffect(() => {
    const elements = panel.current?.querySelectorAll<HTMLElement>(
      ".formulation-equation-list [data-equation-symbol], [data-symbol-definition]",
    );
    elements?.forEach((element) => {
      element.toggleAttribute("data-highlighted", active !== null
        && (element.dataset.equationSymbol ?? element.dataset.symbolDefinition) === active);
    });

    const sidebar = glossary.current;
    const row = sidebar?.querySelector("[data-highlighted]");
    if (!sidebar || !row || sidebar.scrollHeight <= sidebar.clientHeight) return;
    const bounds = sidebar.getBoundingClientRect();
    const item = row.getBoundingClientRect();
    if (item.top < bounds.top) sidebar.scrollTop += item.top - bounds.top - 8;
    if (item.bottom > bounds.bottom) sidebar.scrollTop += item.bottom - bounds.bottom + 8;
  }, [active, glossaryOpen]);

  useEffect(() => {
    const root = panel.current;
    if (!root || !allowBulkTranslations) return;
    const syncTranslations = () => setTranslationsOpen(getTranslationDisclosures(root).every(({ open }) => open));
    root.addEventListener("toggle", syncTranslations, true);
    return () => root.removeEventListener("toggle", syncTranslations, true);
  }, [allowBulkTranslations]);

  const toggle = (symbol: NotationKey) => setSelected((previous) => previous === symbol ? null : symbol);

  return (
    <div
      ref={panel}
      className="formulation-topic-equations"
      onPointerOver={(event) => {
        if (event.pointerType !== "touch") setHovered(getSymbol(event.target) ?? null);
      }}
      onPointerOut={(event) => {
        if (getSymbol(event.target) !== getSymbol(event.relatedTarget)) setHovered(null);
      }}
      onPointerLeave={() => setHovered(null)}
      onFocus={(event) => setFocused(getSymbol(event.target) ?? null)}
      onBlur={() => setFocused(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setSelected(null);
      }}
    >
      <div className="formulation-equation-list"
        onClick={(event) => {
          const symbol = getSymbol(event.target);
          if (symbol) {
            setFocused(null);
            toggle(symbol);
          }
        }}>
        {allowBulkTranslations && (
          <button type="button" className="routing-text-action" onClick={() => {
            const translations = getTranslationDisclosures(panel.current);
            const open = !translations.every((translation) => translation.open);
            translations.forEach((translation) => { translation.open = open; });
            setTranslationsOpen(open);
          }}>{translationsOpen ? "Hide all translations" : "Show all translations"}</button>
        )}
        {children}
      </div>
      <aside className="formulation-symbols" aria-label="Symbols in these equations" ref={glossary}>
        <details onToggle={(event) => setGlossaryOpen(event.currentTarget.open)}>
          <summary>Symbol key</summary>
          <NotationList symbols={symbols} selected={selected} onSelect={toggle} />
        </details>
        {activeDefinition && !glossaryOpen && (
          <p className="formulation-symbol-preview"><MathFormula latex={activeDefinition[0]} /> {activeDefinition[1]}</p>
        )}
      </aside>
      {activeDefinition && (
        <div className="formulation-current-symbol">
          <p><MathFormula latex={activeDefinition[0]} /> <span>{activeDefinition[1]}</span></p>
          {selected && <button type="button" aria-label="Clear symbol selection" onClick={() => setSelected(null)}>×</button>}
        </div>
      )}
    </div>
  );
}

function getFormulas(equations: readonly EquationEntry[]) {
  return equations.flatMap(([, , latex, , condition]) => condition ? [latex, condition] : [latex]);
}

export function TopicEquations({ numbers }: { numbers: readonly number[] }) {
  const groups = formulation.map((group) => ({
    ...group,
    selected: group.equations.filter(([number]) => numbers.includes(number)),
  })).filter(({ selected }) => selected.length > 0);

  return (
    <EquationPanel formulas={groups.flatMap(({ selected }) => getFormulas(selected))} allowBulkTranslations={numbers.length > 1}>
      {groups.map(({ title, equations, note, selected }) => (
        <div key={title}>
          <EquationList equations={selected} />
          {note && numbers.includes(equations[0][0]) && <p className="routing-equation-note">{note}</p>}
        </div>
      ))}
    </EquationPanel>
  );
}

export function ReplayObjective() {
  return (
    <EquationPanel formulas={[replayObjective]}>
      <MathFormula latex={replayObjective} display linked />
      <PlainLanguage translation={replayTranslation} label="the replay objective" />
    </EquationPanel>
  );
}
