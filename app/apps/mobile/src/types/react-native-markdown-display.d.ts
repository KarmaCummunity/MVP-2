declare module 'react-native-markdown-display' {
  import { ComponentType, ReactNode } from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  export interface ASTNode {
    key: string;
    type: string;
    index?: number;
    attributes?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export type RenderRules = Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: ASTNode, children: ReactNode, parent?: any, styles?: any) => ReactNode
  >;

  export interface MarkdownProps {
    style?: { [key: string]: StyleProp<ViewStyle | TextStyle> };
    rules?: RenderRules;
    children: string;
    onLinkPress?: (url: string) => boolean;
  }

  const Markdown: ComponentType<MarkdownProps>;
  export default Markdown;
}
