'use client';

import { type AdminEntity, ENTITY_CONFIG, type FieldErrors } from '@/features/admin/content-entities';

/** Các ô nhập của một loại nội dung — dùng chung cho trang chi tiết và popup Thêm / Sửa. */
export function EntityFields({ entity, values, errors, disabled, onChange, idPrefix = 'f' }: {
  entity: AdminEntity;
  values: Record<string, string>;
  errors: FieldErrors;
  disabled: boolean;
  onChange: (name: string, value: string) => void;
  idPrefix?: string;
}) {
  return (
    <div className="adm-form">
      {ENTITY_CONFIG[entity].fields.map((field) => {
        const error = errors[field.name];
        const common = {
          id: `${idPrefix}-${field.name}`, name: field.name, value: values[field.name] ?? '', 'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `${idPrefix}-e-${field.name}` : undefined, disabled,
          onChange: (event: { target: { value: string } }) => onChange(field.name, event.target.value),
        };
        const className = field.isJapanese ? 'adm-jp' : '';
        return (
          <label key={field.name} className={`adm-field ${field.kind === 'textarea' ? 'wide' : ''}`} htmlFor={common.id}>
            <span>{field.label}{field.required ? ' *' : ''}</span>
            {field.kind === 'textarea'
              ? <textarea {...common} className={`adm-textarea ${className}`} maxLength={field.max} />
              : field.kind === 'day'
                ? <input {...common} className="adm-input" type="number" min={1} max={90} inputMode="numeric" placeholder="Chưa gắn" />
                : field.kind === 'number'
                  ? <input {...common} className="adm-input" type="number" min={field.min} max={field.max} inputMode="numeric" />
                  : <input {...common} className={`adm-input ${className}`} maxLength={field.max} lang={field.isJapanese ? 'ja' : undefined} />}
            {error ? <small id={`${idPrefix}-e-${field.name}`} className="adm-err">{error}</small> : field.help ? <small>{field.help}</small> : null}
          </label>
        );
      })}
    </div>
  );
}
