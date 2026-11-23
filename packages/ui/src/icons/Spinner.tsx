import { Icon } from './Icon';
import { includeIcons } from './store';
import phCircleNotch from './ph/circle-notch';

includeIcons(phCircleNotch);

/** The loading spinner of Button. */
export function Spinner() {
  return <Icon name="circle-notch" className="ui-spin" size={16} />;
}
