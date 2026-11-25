/* Every built-in icon in one list, for the `icons` export (map.ts) and the single-file bundle. Pages that use neither
   never load this file; their icons come one module each through names.ts. No side effects: names-inline.ts reads it
   while the icon store is still loading. */
import phArchive from './ph/archive';
import phArrowDown from './ph/arrow-down';
import phArrowLeft from './ph/arrow-left';
import phArrowRight from './ph/arrow-right';
import phArrowSquareOut from './ph/arrow-square-out';
import phArrowUUpLeft from './ph/arrow-u-up-left';
import phArrowUUpRight from './ph/arrow-u-up-right';
import phArrowUp from './ph/arrow-up';
import phArrowsClockwise from './ph/arrows-clockwise';
import phArrowsInLineVertical from './ph/arrows-in-line-vertical';
import phArrowsOutLineVertical from './ph/arrows-out-line-vertical';
import phCornersOut from './ph/corners-out';
import phBell from './ph/bell';
import phCalendarBlank from './ph/calendar-blank';
import phCaretDown from './ph/caret-down';
import phCaretLeft from './ph/caret-left';
import phCaretRight from './ph/caret-right';
import phCaretUp from './ph/caret-up';
import phChartBar from './ph/chart-bar';
import phChartLine from './ph/chart-line';
import phChartPie from './ph/chart-pie';
import phChatCentered from './ph/chat-centered';
import phCheck from './ph/check';
import phCheckCircle from './ph/check-circle';
import phCircleNotch from './ph/circle-notch';
import phClock from './ph/clock';
import phCloud from './ph/cloud';
import phCopy from './ph/copy';
import phCpu from './ph/cpu';
import phDatabase from './ph/database';
import phDotsThree from './ph/dots-three';
import phDotsThreeVertical from './ph/dots-three-vertical';
import phDownloadSimple from './ph/download-simple';
import phEnvelopeSimple from './ph/envelope-simple';
import phEye from './ph/eye';
import phEyeSlash from './ph/eye-slash';
import phFile from './ph/file';
import phFileText from './ph/file-text';
import phFloppyDisk from './ph/floppy-disk';
import phFolder from './ph/folder';
import phFolderOpen from './ph/folder-open';
import phFunnel from './ph/funnel';
import phGauge from './ph/gauge';
import phGear from './ph/gear';
import phGlobe from './ph/globe';
import phHardDrives from './ph/hard-drives';
import phHeart from './ph/heart';
import phHouse from './ph/house';
import phImage from './ph/image';
import phInfo from './ph/info';
import phKey from './ph/key';
import phLayout from './ph/layout';
import phLink from './ph/link';
import phList from './ph/list';
import phListBullets from './ph/list-bullets';
import phLock from './ph/lock';
import phMagnifyingGlass from './ph/magnifying-glass';
import phMinus from './ph/minus';
import phMonitor from './ph/monitor';
import phMoon from './ph/moon';
import phPaperPlaneTilt from './ph/paper-plane-tilt';
import phPencilSimple from './ph/pencil-simple';
import phPlus from './ph/plus';
import phPrinter from './ph/printer';
import phPulse from './ph/pulse';
import phQuestion from './ph/question';
import phShareNetwork from './ph/share-network';
import phShield from './ph/shield';
import phSidebarSimple from './ph/sidebar-simple';
import phSignIn from './ph/sign-in';
import phSignOut from './ph/sign-out';
import phSlidersHorizontal from './ph/sliders-horizontal';
import phSquaresFour from './ph/squares-four';
import phStar from './ph/star';
import phSun from './ph/sun';
import phTrash from './ph/trash';
import phUploadSimple from './ph/upload-simple';
import phUser from './ph/user';
import phUsers from './ph/users';
import phWarning from './ph/warning';
import phWarningCircle from './ph/warning-circle';
import phX from './ph/x';
import phXCircle from './ph/x-circle';
import phColumns from './ph/columns';
import phSquare from './ph/square';
import phCheckSquare from './ph/check-square';
import phBracketsCurly from './ph/brackets-curly';
import phFunction from './ph/function';
import phStack from './ph/stack';
import phTerminalWindow from './ph/terminal-window';
import phFileCode from './ph/file-code';
import phHash from './ph/hash';
import phCommand from './ph/command';
import phTag from './ph/tag';
import phSortAscending from './ph/sort-ascending';
import phDotsSixVertical from './ph/dots-six-vertical';
import phPushPin from './ph/push-pin';
import phKeyboard from './ph/keyboard';
import phArrowsLeftRight from './ph/arrows-left-right';
import phSparkle from './ph/sparkle';
import phTrendUp from './ph/trend-up';
import phCornersIn from './ph/corners-in';
import type { IconGlyph } from './glyph';
import phPause from './ph/pause';
import phPlay from './ph/play';
import phProhibit from './ph/prohibit';
import phReceipt from './ph/receipt';
import phTruck from './ph/truck';
import phPackage from './ph/package';
import phCreditCard from './ph/credit-card';
import phShoppingCart from './ph/shopping-cart';
import phStorefront from './ph/storefront';
import phMapPin from './ph/map-pin';
import phPhone from './ph/phone';

/** Every built-in icon. */
export const ALL: readonly IconGlyph[] = [
  phArchive,
  phArrowDown,
  phArrowLeft,
  phArrowRight,
  phArrowSquareOut,
  phArrowUUpLeft,
  phArrowUUpRight,
  phArrowUp,
  phArrowsClockwise,
  phArrowsInLineVertical,
  phArrowsOutLineVertical,
  phCornersOut,
  phBell,
  phCalendarBlank,
  phCaretDown,
  phCaretLeft,
  phCaretRight,
  phCaretUp,
  phChartBar,
  phChartLine,
  phChartPie,
  phChatCentered,
  phCheck,
  phCheckCircle,
  phCircleNotch,
  phClock,
  phCloud,
  phCopy,
  phCpu,
  phDatabase,
  phDotsThree,
  phDotsThreeVertical,
  phDownloadSimple,
  phEnvelopeSimple,
  phEye,
  phEyeSlash,
  phFile,
  phFileText,
  phFloppyDisk,
  phFolder,
  phFolderOpen,
  phFunnel,
  phGauge,
  phGear,
  phGlobe,
  phHardDrives,
  phHeart,
  phHouse,
  phImage,
  phInfo,
  phKey,
  phLayout,
  phLink,
  phList,
  phListBullets,
  phLock,
  phMagnifyingGlass,
  phMinus,
  phMonitor,
  phMoon,
  phPaperPlaneTilt,
  phPencilSimple,
  phPlus,
  phPrinter,
  phPulse,
  phQuestion,
  phShareNetwork,
  phShield,
  phSidebarSimple,
  phSignIn,
  phSignOut,
  phSlidersHorizontal,
  phSquaresFour,
  phStar,
  phSun,
  phTrash,
  phUploadSimple,
  phUser,
  phUsers,
  phWarning,
  phWarningCircle,
  phX,
  phXCircle,
  phColumns,
  phSquare,
  phCheckSquare,
  phBracketsCurly,
  phFunction,
  phStack,
  phTerminalWindow,
  phFileCode,
  phHash,
  phCommand,
  phTag,
  phSortAscending,
  phDotsSixVertical,
  phPushPin,
  phKeyboard,
  phArrowsLeftRight,
  phSparkle,
  phTrendUp,
  phCornersIn,
  phPause,
  phPlay,
  phProhibit,
  phReceipt,
  phTruck,
  phPackage,
  phCreditCard,
  phShoppingCart,
  phStorefront,
  phMapPin,
  phPhone,
];
