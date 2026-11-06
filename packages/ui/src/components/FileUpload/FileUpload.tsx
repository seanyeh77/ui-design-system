import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { ProgressBar } from '../ProgressBar/ProgressBar';

export interface UploadFile {
  id?: string | number;
  name: string;
  /** format.fileSize(bytes), e.g. 「1.2 MB」. */
  size?: string;
  /** 0 to 100 while uploading. */
  progress?: number;
  status?: 'uploading' | 'done' | 'error';
  /** The cause and the fix, shown in red. */
  error?: string;
}

export interface FileUploadProps {
  label?: string;
  files?: UploadFile[];
  onAdd?: (files: File[]) => void;
  onRemove?: (file: UploadFile) => void;
  onRetry?: (file: UploadFile) => void;
  /** Written inside the drop zone, e.g. 「每個最大 100 MB」. */
  limitText?: string;
  accept?: string;
  /** Default true. */
  multiple?: boolean;
  className?: string;
}

/** A one-line drop zone and a list of files with progress. The upload itself is yours: pass files with progress and status. */
export function FileUpload({ label, files = [], onAdd, onRemove, onRetry, limitText, accept, multiple = true, className }: FileUploadProps) {
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    if (arr.length) onAdd?.(arr);
  };
  return (
    <div className={cx('ui-upload', className)}>
      {label ? <span className="ui-field-label">{label}</span> : null}
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
            const fail = fl.status === 'error';
            return (
              <li key={fl.id ?? fl.name} className={cx('ui-upload-item', fail && 'is-error')}>
                <Icon name="file" size={20} className="ui-upload-icon" />
                <div className="ui-upload-body">
                  <div className="ui-upload-row">
                    <span className="ui-upload-name">{fl.name}</span>
                    {fl.size ? <span className="ui-upload-size">{fl.size}</span> : null}
                  </div>
                  {!fail ? (
                    <ProgressBar value={fl.status === 'done' ? 100 : fl.progress || 0} />
                  ) : (
                    <div className="ui-upload-error" role="alert">
                      {fl.error || tr('上傳失敗，請再試一次。')}
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

