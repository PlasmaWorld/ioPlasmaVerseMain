// react-syntax-highlighter.d.ts
declare module 'react-syntax-highlighter' {
    import * as React from 'react';
  
    export interface SyntaxHighlighterProps {
      language: string;
      style: any;
      children: string;
    }
  
    export class Prism extends React.Component<SyntaxHighlighterProps> {}
  }
  