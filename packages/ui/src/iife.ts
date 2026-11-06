/* The single-file build (dist/bundle.js) for pages without a build step: React 19 and every component in one script.
   It sets window.React, window.ReactDOM and window.UI, so a page needs no other script tag. */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as UI from './index';

declare global {
  interface Window {
    UI: typeof UI;
    React: typeof React;
    ReactDOM: typeof ReactDOM & typeof ReactDOMClient;
  }
}

window.React = React;
window.ReactDOM = { ...ReactDOM, ...ReactDOMClient };
window.UI = UI;
