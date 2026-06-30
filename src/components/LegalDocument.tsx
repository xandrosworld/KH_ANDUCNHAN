import type { LegalDocument as LegalDocumentData } from '../data/legalDocuments';

interface LegalDocumentProps {
  document: LegalDocumentData;
  compact?: boolean;
}

export default function LegalDocument({ document, compact = false }: LegalDocumentProps) {
  return (
    <article className={compact ? 'space-y-4' : 'space-y-5'}>
      <header className={compact ? 'space-y-2' : 'space-y-3'}>
        <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#b40014]">
          Cập nhật {document.effectiveDate}
        </div>
        <div>
          <h1 className={compact ? 'text-2xl font-black text-[#242832]' : 'text-3xl font-black text-[#242832] sm:text-4xl'}>
            {document.title}
          </h1>
          <p className={compact ? 'mt-1 text-sm font-bold text-[#6b7280]' : 'mt-2 text-base font-bold text-[#6b7280]'}>
            {document.subtitle}
          </p>
        </div>
        <p className="rounded-2xl border border-[#f0e1d8] bg-[#fff9f5] p-4 text-sm font-semibold leading-6 text-[#505866]">
          {document.summary}
        </p>
      </header>

      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {document.sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-[#eee2db] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-[15px] font-black leading-6 text-[#9a0012] sm:text-base">{section.title}</h2>
            {section.body ? <p className="mt-2 text-sm font-medium leading-6 text-[#4f5663]">{section.body}</p> : null}
            {section.bullets ? (
              <ul className="mt-2 space-y-2">
                {section.bullets.map((item) => (
                  <li key={item} className="flex gap-2 text-sm font-medium leading-6 text-[#4f5663]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c40012]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}

