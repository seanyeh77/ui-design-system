import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { FieldLabel } from '../../internal/Field';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { includeIcons } from '../../icons/store';
import phFile from '../../icons/ph/file';
import phUploadSimple from '../../icons/ph/upload-simple';
import phX from '../../icons/ph/x';
import { codeText } from '../InlineCode/InlineCode';

includeIcons(phFile, phUploadSimple, phX);

export interface UploadFile {
  id?: string | number;
  name: string;
  /** format.fileSize(bytes), e.g. 「1.2 MB」. */
  size?: string;
  /** 0 to 100 while uploading. */
  progress?: number;
  /** 'danger': the upload failed; write why in `error`. ('error' is the old name of 'danger'.) */
  status?: 'uploading' | 'done' | 'danger' | 'error';
  /** The cause and the fix, shown in red; `backticks` are code. */
  error?: string;
}

export interface FileUploadProps {
  /** The field's label above the drop zone. */
  label?: string;
  /** The files added so far, with their upload progress and status. */
  files?: UploadFile[];
  /** Called with the files the person picked or dropped; upload them and update files. */
  onAdd?: (files: File[]) => void;
  /** Called by a file's × button. */
  onRemove?: (file: UploadFile) => void;
  /** Called by 「重試」 on a file whose status is danger. */
  onRetry?: (file: UploadFile) => void;
  /** Written inside the drop zone, e.g. 「每個最大 100 MB」. */
  limitText?: string;
  /** File types the picker offers, as in <input accept>, e.g. ".pdf,image/*". */
  accept?: string;
  /** Default true. */
  multiple?: boolean;
  /** Extra class on the root element. */
  className?: string;
}

/** A one-line drop zone and a list of files with progress. The upload itself is yours: pass files with progress and status. */
export function FileUpload({ label, files = [], onAdd, onRemove, onRetry, limitText, accept, multiple = true, className }: FileUploadProps) {
  devWarn(
    () => files.some((f) => f.status === 'error'),
    'FileUpload',
    "status: 'error' is the old name, kept for now. Write status: 'danger', the tone name the other components use.",
  );
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    if (arr.length) onAdd?.(arr);
  };
  return (
    <div className={cx('ui-upload', className)}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div
        className={cx('ui-dropline', drag && 'is-drag')}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
      >
        <Icon name="upload-simple" size={18} />
        <span className="ui-dropline-text">
          {tr('拖放檔案，或 ')}
          <button type="button" className="ui-link-btn" onClick={() => input.current?.click()}>
            {tr('選擇檔案')}
          </button>
        </span>
        {limitText ? <span className="ui-dropline-limit">{limitText}</span> : null}
        <input
          ref={input}
          type="file"
          multiple={multiple}
          accept={accept}
          hidden
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {files.length ? (
        <ul className="ui-upload-list">
          {files.map((fl) => {
            const fail = fl.status === 'danger' || fl.status === 'error';
            return (
              <li key={fl.id ?? fl.name} className={cx('ui-upload-item', fail && 'is-error')}>
                <Icon name="file" size={20} className="ui-upload-icon" />
                <div className="ui-upload-body">
                  <div className="ui-upload-row">
                    <span className="ui-upload-name">{fl.name}</span>
                    {fl.size ? <span className="ui-upload-size">{fl.size}</span> : null}
                  </div>
                  {!fail ? (
                    <ProgressBar value={fl.status === 'done' ? 100 : fl.progress || 0} aria-label={tr('{name} 上傳進度', { name: fl.name })} />
                  ) : (
                    <div className="ui-upload-error" role="alert">
                      {codeText(fl.error || tr('上傳失敗，請再試一次。'))}
                      {onRetry ? (
                        <button type="button" className="ui-link-btn" onClick={() => onRetry(fl)}>
                          {tr('重試')}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                {onRemove ? (
                  <button type="button" className="ui-dialog-close" aria-label={tr('移除 {name}', { name: fl.name })} onClick={() => onRemove(fl)}>
                    <Icon name="x" size={16} />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
