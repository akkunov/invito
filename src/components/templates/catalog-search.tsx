"use client";

import { useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export function CatalogSearch({ initialValue, label, clearLabel }: { initialValue: string; label: string; clearLabel: string }) {
  const [value, setValue] = useState(initialValue);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  return <div className="search-control">
    <Search size={19} aria-hidden="true"/><label htmlFor={inputId} className="sr-only">{label}</label>
    <input id={inputId} ref={input} name="search" type="search" value={value} onChange={event => setValue(event.target.value)} placeholder={label}/>
    {value && <button type="button" className="catalog-search-clear" aria-label={clearLabel} onClick={() => {
      setValue("");
      if (input.current) {
        input.current.value = "";
        input.current.form?.requestSubmit();
        input.current.focus();
      }
    }}><X size={16} aria-hidden="true"/></button>}
  </div>;
}
