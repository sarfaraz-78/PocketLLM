import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';

interface CSSStyles {
  [key: string]: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    marginBottom?: number;
    lineHeight?: number;
    padding?: number;
    borderRadius?: number;
    marginTop?: number;
    borderWidth?: number;
    borderColor?: string;
    [key: string]: any;
  };
}

interface ParsedElement {
  tag: string;
  content: string;
  className: string;
  inlineStyle: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
}

export const BrowserScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const { colors } = useTheme();

  const { browserUrl, setBrowserUrl, bookmarks, files } = useWorkspaceStore();
  const [inputUrl, setInputUrl] = useState(browserUrl);
  const [loading, setLoading] = useState(false);
  const [buttonClicks, setButtonClicks] = useState(0);

  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return 'http://localhost:3000';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.includes('.') && !trimmed.includes(' ')) return 'https://' + trimmed;
    return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
  };

  const handleNavigation = async (newUrl: string) => {
    setLoading(true);
    const normalized = normalizeUrl(newUrl);
    setBrowserUrl(normalized);
    setInputUrl(normalized);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  const handleExternalOpen = async () => {
    try {
      const supported = await Linking.canOpenURL(browserUrl);
      if (supported) {
        await Linking.openURL(browserUrl);
      } else {
        Alert.alert('Error', `Cannot open URL: ${browserUrl}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open browser');
    }
  };

  const getDomainName = (urlStr: string): string => {
    try {
      const match = urlStr.match(/:\/\/(www\.)?([^/:]+)/);
      return match ? match[2] : urlStr;
    } catch (e) {
      return urlStr;
    }
  };

  const cleanStyleValue = (val: string): any => {
    const clean = val.trim();
    if (clean.endsWith('px')) {
      const num = parseFloat(clean);
      return isNaN(num) ? clean : num;
    }
    if (clean.endsWith('%')) {
      return clean;
    }
    const num = parseFloat(clean);
    if (!isNaN(num) && num.toString() === clean) {
      return num;
    }
    return clean;
  };

  const parseShorthand = (val: string, prefix: 'margin' | 'padding'): Record<string, any> => {
    const parts = val.trim().split(/\s+/).map(cleanStyleValue);
    const styles: any = {};
    if (parts.length === 1) {
      styles[prefix] = parts[0];
    } else if (parts.length === 2) {
      styles[`${prefix}Vertical`] = parts[0];
      styles[`${prefix}Horizontal`] = parts[1];
    } else if (parts.length === 3) {
      styles[`${prefix}Top`] = parts[0];
      styles[`${prefix}Horizontal`] = parts[1];
      styles[`${prefix}Bottom`] = parts[2];
    } else if (parts.length === 4) {
      styles[`${prefix}Top`] = parts[0];
      styles[`${prefix}Right`] = parts[1];
      styles[`${prefix}Bottom`] = parts[2];
      styles[`${prefix}Left`] = parts[3];
    }
    return styles;
  };

  const mapCssToRn = (prop: string, val: string): Record<string, any> => {
    const key = prop.trim().toLowerCase();
    const rawValue = val.trim();
    const styles: any = {};

    switch (key) {
      case 'background-color':
      case 'backgroundcolor':
        styles.backgroundColor = rawValue;
        break;
      case 'color':
        styles.color = rawValue;
        break;
      case 'font-size':
      case 'fontsize':
        styles.fontSize = parseFloat(rawValue);
        break;
      case 'font-weight':
      case 'fontweight':
        styles.fontWeight = rawValue;
        break;
      case 'font-style':
      case 'fontstyle':
        styles.fontStyle = rawValue;
        break;
      case 'text-align':
      case 'textalign':
        styles.textAlign = rawValue;
        break;
      case 'display':
        if (rawValue === 'flex') styles.display = 'flex';
        break;
      case 'flex-direction':
      case 'flexdirection':
        styles.flexDirection = rawValue;
        break;
      case 'justify-content':
      case 'justifycontent':
        styles.justifyContent = rawValue;
        break;
      case 'align-items':
      case 'alignitems':
        styles.alignItems = rawValue;
        break;
      case 'flex-wrap':
      case 'flexwrap':
        styles.flexWrap = rawValue;
        break;
      case 'gap':
        styles.gap = parseFloat(rawValue);
        break;
      case 'flex':
        styles.flex = parseFloat(rawValue);
        break;
      case 'width':
        styles.width = cleanStyleValue(rawValue);
        break;
      case 'height':
        styles.height = cleanStyleValue(rawValue);
        break;
      case 'min-width':
      case 'minwidth':
        styles.minWidth = cleanStyleValue(rawValue);
        break;
      case 'min-height':
      case 'minheight':
        styles.minHeight = cleanStyleValue(rawValue);
        break;
      case 'max-width':
      case 'maxwidth':
        styles.maxWidth = cleanStyleValue(rawValue);
        break;
      case 'max-height':
      case 'maxheight':
        styles.maxHeight = cleanStyleValue(rawValue);
        break;
      case 'margin':
        return parseShorthand(rawValue, 'margin');
      case 'margin-top':
      case 'margintop':
        styles.marginTop = parseFloat(rawValue);
        break;
      case 'margin-bottom':
      case 'marginbottom':
        styles.marginBottom = parseFloat(rawValue);
        break;
      case 'margin-left':
      case 'marginleft':
        styles.marginLeft = parseFloat(rawValue);
        break;
      case 'margin-right':
      case 'marginright':
        styles.marginRight = parseFloat(rawValue);
        break;
      case 'padding':
        return parseShorthand(rawValue, 'padding');
      case 'padding-top':
      case 'paddingtop':
        styles.paddingTop = parseFloat(rawValue);
        break;
      case 'padding-bottom':
      case 'paddingbottom':
        styles.paddingBottom = parseFloat(rawValue);
        break;
      case 'padding-left':
      case 'paddingleft':
        styles.paddingLeft = parseFloat(rawValue);
        break;
      case 'padding-right':
      case 'paddingright':
        styles.paddingRight = parseFloat(rawValue);
        break;
      case 'border-radius':
      case 'borderradius':
        styles.borderRadius = parseFloat(rawValue);
        break;
      case 'border-width':
      case 'borderwidth':
        styles.borderWidth = parseFloat(rawValue);
        break;
      case 'border-color':
      case 'bordercolor':
        styles.borderColor = rawValue;
        break;
      case 'border':
        const borderParts = rawValue.split(/\s+/);
        borderParts.forEach((part) => {
          if (part.endsWith('px')) {
            styles.borderWidth = parseFloat(part);
          } else if (part.startsWith('#') || part.startsWith('rgb') || ['red', 'blue', 'green', 'black', 'white', 'gray'].includes(part)) {
            styles.borderColor = part;
          }
        });
        break;
    }
    return styles;
  };

  // Helper: CSS Style parser
  const parseCSS = (cssText: string): CSSStyles => {
    const styles: CSSStyles = {};
    try {
      const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
      const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
      let match;
      while ((match = ruleRegex.exec(cleanCss)) !== null) {
        const selector = match[1].trim();
        const declsText = match[2].trim();
        const declarations = declsText.split(';');
        const ruleStyles: any = {};

        declarations.forEach((decl) => {
          if (!decl.trim()) return;
          const [prop, val] = decl.split(':').map((s) => s.trim());
          if (!prop || !val) return;

          Object.assign(ruleStyles, mapCssToRn(prop, val));
        });
        styles[selector] = ruleStyles;
      }
    } catch (e) {
      console.warn('Failed parsing local CSS rules', e);
    }
    return styles;
  };

  // Upgraded HTML AST Tree Tokenizer & Parser
  const tokenizeHTML = (html: string) => {
    const tokens: { type: 'tag' | 'text'; value: string }[] = [];
    const regex = /(<[^>]+>)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = html.substring(lastIndex, match.index).trim();
      if (text) {
        tokens.push({ type: 'text', value: text });
      }
      tokens.push({ type: 'tag', value: match[0] });
      lastIndex = regex.lastIndex;
    }
    const remainingText = html.substring(lastIndex).trim();
    if (remainingText) {
      tokens.push({ type: 'text', value: remainingText });
    }
    return tokens;
  };

  const parseTokens = (tokens: { type: 'tag' | 'text'; value: string }[]): ParsedElement[] => {
    const root: ParsedElement = { tag: 'root', content: '', className: '', inlineStyle: '', attributes: {}, children: [] };
    const stack: ParsedElement[] = [root];

    for (const token of tokens) {
      if (token.type === 'text') {
        const current = stack[stack.length - 1];
        if (current) {
          current.children.push({
            tag: 'text-node',
            content: token.value,
            className: '',
            inlineStyle: '',
            attributes: {},
            children: []
          });
        }
      } else if (token.type === 'tag') {
        const tagStr = token.value;
        if (tagStr.startsWith('<!--')) {
          continue;
        }
        if (tagStr.startsWith('</')) {
          const tagName = tagStr.substring(2, tagStr.length - 1).trim().toLowerCase();
          let foundIdx = -1;
          for (let i = stack.length - 1; i >= 1; i--) {
            if (stack[i].tag === tagName) {
              foundIdx = i;
              break;
            }
          }
          if (foundIdx !== -1) {
            stack.length = foundIdx;
          } else {
            if (stack.length > 1) {
              stack.pop();
            }
          }
        } else {
          const isSelfClosing = tagStr.endsWith('/>') || ['img', 'br', 'input', 'hr', 'meta', 'link'].includes(
            tagStr.match(/^<(\w+)/)?.[1]?.toLowerCase() || ''
          );
          const insideMatch = tagStr.match(/^<(\w+)([\s\S]*?)>?$/);
          if (insideMatch) {
            const tagName = insideMatch[1].toLowerCase();
            const attrStr = insideMatch[2].trim();

            const attributes: Record<string, string> = {};
            const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
              const name = attrMatch[1].toLowerCase();
              const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
              attributes[name] = val;
            }

            const className = attributes['class'] || '';
            const inlineStyle = attributes['style'] || '';

            const newEl: ParsedElement = {
              tag: tagName,
              content: '',
              className,
              inlineStyle,
              attributes,
              children: []
            };

            const current = stack[stack.length - 1];
            if (current) {
              current.children.push(newEl);
            }

            if (!isSelfClosing) {
              stack.push(newEl);
            }
          }
        }
      }
    }

    return root.children;
  };

  // Sub-component for Writable Interactive Text Inputs in the local HTML page
  const LocalInteractiveInput: React.FC<{ el: ParsedElement; colors: any; style: any }> = ({ el, colors, style }) => {
    const type = el.attributes['type'] || 'text';
    const placeholder = el.attributes['placeholder'] || '';
    const [val, setVal] = useState(el.attributes['value'] || '');

    return (
      <TextInput
        style={[
          {
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderRadius: 8,
            fontSize: 13,
            minWidth: 120,
          },
          style,
        ]}
        value={val}
        onChangeText={setVal}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={el.tag === 'textarea'}
        secureTextEntry={type === 'password'}
      />
    );
  };

  // Sub-component for Writable Interactive Button in the local HTML page
  const LocalInteractiveButton: React.FC<{ el: ParsedElement; style: any; colors: any; onClick: () => void }> = ({ el, style, colors, onClick }) => {
    return (
      <TouchableOpacity
        style={[
          {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignSelf: 'flex-start',
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
        onPress={onClick}
        activeOpacity={0.8}
      >
        <Text style={{ color: style.color || '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
          {el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : 'Button')}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render Local Server Website Parser
  const renderLocalServer = () => {
    // Determine the requested file name from the URL path for Local Multi-Page Router
    const urlPath = browserUrl.replace(/^https?:\/\/localhost:3000\/?/, '').trim();
    const targetFileName = urlPath || 'index.html';

    // Find requested HTML file in workspace
    const htmlFile = files.find((f) => f.name.toLowerCase() === targetFileName.toLowerCase()) ||
                     files.find((f) => f.name.endsWith('.html')) ||
                     files.find((f) => f.language === 'html');

    if (!htmlFile || !htmlFile.content) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
          <View style={styles.webContentBlock}>
            <Icon name="cloud-offline-outline" size={48} color={colors.error} />
            <Text style={[styles.webTitle, { color: colors.text }]}>LOCAL PORT 3000</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.webDesc, { color: colors.textSecondary }]}>
              No active local server found. Let's start one!
            </Text>
            <Text style={[styles.webSubDesc, { color: colors.textTertiary }]}>
              Create a file named <Text style={{ color: colors.primary, fontWeight: '700' }}>index.html</Text> in your Workspace IDE. Once created, the Pocket-WebKit compiler will automatically parse and render it live!
            </Text>
          </View>
        </View>
      );
    }

    // Extract styles
    const styleMatch = htmlFile.content.match(/<style>([\s\S]*?)<\/style>/);
    const cssRules = styleMatch ? parseCSS(styleMatch[1]) : {};

    // Extract body content
    const bodyMatch = htmlFile.content.match(/<body>([\s\S]*?)<\/body>/);
    const bodyHtml = bodyMatch ? bodyMatch[1] : htmlFile.content;

    // Use our advanced recursive tree tokenizer and parser
    const tokens = tokenizeHTML(bodyHtml);
    const parsedElements = parseTokens(tokens);

    // Dynamic style applier helper
    const getStylesForElement = (el: ParsedElement) => {
      let finalStyle: any = {};

      // 1. Tag base style
      if (cssRules[el.tag]) {
        finalStyle = { ...finalStyle, ...cssRules[el.tag] };
      }
      // 2. Class style
      if (el.className) {
        el.className.split(/\s+/).forEach((cls) => {
          const classSelector = '.' + cls.trim();
          if (cssRules[classSelector]) {
            finalStyle = { ...finalStyle, ...cssRules[classSelector] };
          }
        });
      }
      // 3. ID selector style
      const idAttr = el.attributes['id'];
      if (idAttr) {
        const idSelector = '#' + idAttr.trim();
        if (cssRules[idSelector]) {
          finalStyle = { ...finalStyle, ...cssRules[idSelector] };
        }
      }
      // 4. Inline style parser overrides
      if (el.inlineStyle) {
        el.inlineStyle.split(';').forEach((s) => {
          if (!s.trim()) return;
          const [prop, val] = s.split(':').map((p) => p.trim());
          if (prop && val) {
            Object.assign(finalStyle, mapCssToRn(prop, val));
          }
        });
      }

      return finalStyle;
    };

    // Recursive component to render elements of any depth
    const RenderElement: React.FC<{ el: ParsedElement; index: number }> = ({ el, index }) => {
      const elStyle = getStylesForElement(el);

      if (el.tag === 'text-node') {
        return (
          <Text key={index} style={[{ color: colors.text }, elStyle]}>
            {el.content}
          </Text>
        );
      }

      // Interactive Writable Input & Textarea
      if (el.tag === 'input' || el.tag === 'textarea') {
        return (
          <LocalInteractiveInput
            key={index}
            el={el}
            colors={colors}
            style={elStyle}
          />
        );
      }

      // Live remote / local Image tag
      if (el.tag === 'img') {
        const src = el.attributes['src'] || 'https://picsum.photos/200/150';
        const alt = el.attributes['alt'] || 'image';
        return (
          <Image
            key={index}
            source={{ uri: src }}
            style={[{ width: 200, height: 150, borderRadius: 8 }, elStyle]}
            alt={alt}
          />
        );
      }

      // Bullet / ordered list
      if (el.tag === 'ul' || el.tag === 'ol') {
        return (
          <View key={index} style={[{ paddingLeft: 12 }, elStyle]}>
            {el.children.map((child, idx) => {
              if (child.tag === 'li') {
                const childStyle = getStylesForElement(child);
                return (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
                    <Text style={{ marginRight: 6, color: colors.primary, fontWeight: 'bold' }}>
                      {el.tag === 'ol' ? `${idx + 1}.` : '•'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <RenderElement el={child} index={idx} />
                    </View>
                  </View>
                );
              }
              return <RenderElement key={idx} el={child} index={idx} />;
            })}
          </View>
        );
      }

      // Anchor Links supporting Local Multi-page Routing
      if (el.tag === 'a') {
        const href = el.attributes['href'] || '';
        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (href.startsWith('http://') || href.startsWith('https://')) {
                handleNavigation(href);
              } else if (href) {
                const cleanHref = href.startsWith('/') ? href.substring(1) : href;
                handleNavigation(`http://localhost:3000/${cleanHref}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[{ color: colors.primary, textDecorationLine: 'underline' }, elStyle]}>
              {el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : href)}
            </Text>
          </TouchableOpacity>
        );
      }

      // Writable/Clickable Buttons
      if (el.tag === 'button') {
        return (
          <LocalInteractiveButton
            key={index}
            el={el}
            colors={colors}
            style={elStyle}
            onClick={() => {
              setButtonClicks((c) => c + 1);
              Alert.alert(
                'Live Interaction',
                `Clicked button: "${el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : 'Button')}"\nTotal Interactions: ${buttonClicks + 1}`
              );
            }}
          />
        );
      }

      // Division structures & layout boxes
      if (['div', 'section', 'footer', 'main', 'nav', 'header', 'aside', 'li'].includes(el.tag)) {
        return (
          <View key={index} style={elStyle}>
            {el.children.map((child, idx) => (
              <RenderElement key={idx} el={child} index={idx} />
            ))}
            {!el.children.length && el.content ? (
              <Text style={{ color: colors.text }}>{el.content}</Text>
            ) : null}
          </View>
        );
      }

      // Standard browser headings
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(el.tag)) {
        let baseFontSize = 14;
        if (el.tag === 'h1') baseFontSize = 24;
        else if (el.tag === 'h2') baseFontSize = 20;
        else if (el.tag === 'h3') baseFontSize = 18;
        else if (el.tag === 'h4') baseFontSize = 16;

        return (
          <Text
            key={index}
            style={[
              { fontSize: baseFontSize, fontWeight: 'bold', marginBottom: 6 },
              elStyle,
            ]}
          >
            {el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : '')}
          </Text>
        );
      }

      // Paragraph elements
      if (el.tag === 'p') {
        return (
          <Text key={index} style={[{ fontSize: 14, lineHeight: 20, marginBottom: 8 }, elStyle]}>
            {el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : '')}
          </Text>
        );
      }

      // Span text nodes
      if (el.tag === 'span') {
        return (
          <Text key={index} style={[{ color: colors.text }, elStyle]}>
            {el.content || (el.children.length > 0 ? el.children.map(c => c.content).join('') : '')}
          </Text>
        );
      }

      return null;
    };

    return (
      <View style={[styles.webBody, { backgroundColor: '#0b0f19' }]}>
        {/* Local live-reload banner */}
        <View style={[styles.localBanner, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Icon name="flash" size={14} color={colors.success} />
          <Text style={[styles.localBannerText, { color: colors.success }]}>
            LIVE PREVIEW: Port 3000 Active  ·  Auto reload enabled
          </Text>
        </View>

        {/* Dynamic elements mapper */}
        <View style={styles.localWebContainer}>
          {parsedElements.map((el, index) => (
            <RenderElement key={index} el={el} index={index} />
          ))}
        </View>
      </View>
    );
  };;

  const renderSimulatedPage = () => {
    const domain = getDomainName(browserUrl).toLowerCase();

    // Localhost Dev server HTML parsing engine
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return renderLocalServer();
    }

    // 1. GitHub Mock Page Layout
    if (domain.includes('github.com')) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
          <View style={styles.gitHubHeader}>
            <View style={styles.gitHubTitleRow}>
              <Icon name="logo-github" size={24} color={colors.text} />
              <Text style={[styles.gitHubRepoName, { color: colors.text }]}>sarfaraz-78 / PocketLLM</Text>
              <View style={[styles.gitPill, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.gitPillText, { color: colors.primary }]}>Public</Text>
              </View>
            </View>
            <View style={styles.gitHubStats}>
              <View style={styles.statItem}>
                <Icon name="star-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.statValue, { color: colors.textSecondary }]}>148 stars</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="git-network-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.statValue, { color: colors.textSecondary }]}>34 forks</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gitDivider, { backgroundColor: colors.border }]} />

          <Text style={[styles.gitSubTitle, { color: colors.textSecondary }]}>Files (main)</Text>
          <View style={[styles.gitFileList, { borderColor: colors.border }]}>
            <View style={[styles.gitFileRow, { borderBottomColor: colors.border }]}>
              <Icon name="folder" size={16} color="#3b82f6" />
              <Text style={[styles.gitFileName, { color: colors.text }]}>src/inference</Text>
              <Text style={[styles.gitCommit, { color: colors.textTertiary }]}>Restore LlamaEngine mmap fallback</Text>
            </View>
            <View style={[styles.gitFileRow, { borderBottomColor: colors.border }]}>
              <Icon name="folder" size={16} color="#3b82f6" />
              <Text style={[styles.gitFileName, { color: colors.text }]}>src/store</Text>
              <Text style={[styles.gitCommit, { color: colors.textTertiary }]}>Add centralized Zustand workspace store</Text>
            </View>
            <View style={[styles.gitFileRow, { borderBottomColor: colors.border }]}>
              <Icon name="document-text" size={16} color="#f59e0b" />
              <Text style={[styles.gitFileName, { color: colors.text }]}>package.json</Text>
              <Text style={[styles.gitCommit, { color: colors.textTertiary }]}>Bump llama.rn library version</Text>
            </View>
            <View style={styles.gitFileRow}>
              <Icon name="document-text" size={16} color="#8b5cf6" />
              <Text style={[styles.gitFileName, { color: colors.text }]}>README.md</Text>
              <Text style={[styles.gitCommit, { color: colors.textTertiary }]}>Update documentation for 5-tab Workspace</Text>
            </View>
          </View>

          <View style={[styles.readmeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.readmeHeader, { borderBottomColor: colors.border }]}>
              <Icon name="book-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.readmeTitleText, { color: colors.text }]}>README.md</Text>
            </View>
            <View style={styles.readmeBody}>
              <Text style={[styles.readmeHeadline, { color: colors.text }]}>PocketLLM Mobile Code Sandbox</Text>
              <Text style={[styles.readmeParagraph, { color: colors.textSecondary }]}>
                A professional React Native application built to run multi-modal large language models fully offline on device using `llama.rn`. Includes IDE code editor tabs, real-time simulated bash command shells, and online Hugging Face explorers.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // 2. Google Mock Page Layout (Search result)
    if (domain.includes('google.com')) {
      const isSearch = browserUrl.includes('search');
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
          <View style={styles.googleSearchHeader}>
            <Text style={[styles.googleColorLogo]}>
              <Text style={{ color: '#4285F4' }}>G</Text>
              <Text style={{ color: '#EA4335' }}>o</Text>
              <Text style={{ color: '#FBBC05' }}>o</Text>
              <Text style={{ color: '#4285F4' }}>g</Text>
              <Text style={{ color: '#34A853' }}>l</Text>
              <Text style={{ color: '#EA4335' }}>e</Text>
            </Text>
          </View>

          <View style={[styles.searchPillBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Icon name="search" size={14} color={colors.textTertiary} />
            <Text style={[styles.searchPillVal, { color: colors.text }]} numberOfLines={1}>
              {isSearch ? decodeURIComponent(browserUrl.split('q=')[1]?.split('&')[0] || '') : 'offline LLM developer tools'}
            </Text>
          </View>

          <View style={[styles.googleDivider, { backgroundColor: colors.border }]} />

          <View style={styles.googleResults}>
            <View style={styles.resultCard}>
              <Text style={styles.resultUrl}>https://github.com › sarfaraz-78 › PocketLLM</Text>
              <TouchableOpacity onPress={() => handleNavigation('https://github.com')}>
                <Text style={[styles.resultTitle, { color: colors.primary }]}>
                  PocketLLM: Offline On-Device AI Coding Assistant for Mobile
                </Text>
              </TouchableOpacity>
              <Text style={[styles.resultSnippet, { color: colors.textSecondary }]}>
                PocketLLM brings professional IDE capabilities directly into your pocket. Run GGUF models locally, edit files with monospace editors, and auto-discover GGUF resources.
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultUrl}>https://huggingface.co › models</Text>
              <Text style={[styles.resultTitle, { color: colors.primary }]}>
                Discover Offline GGUF AI Models - Hugging Face Hub
              </Text>
              <Text style={[styles.resultSnippet, { color: colors.textSecondary }]}>
                Download highly quantized Q4_K_M or Q5_K_M language models ranging from 0.5B to 3B parameters optimized to fit perfectly within standard mobile RAM hardware tiers.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // 3. Stack Overflow Mock Page Layout
    if (domain.includes('stackoverflow.com')) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
          <View style={styles.stackHeader}>
            <Icon name="logo-stackoverflow" size={24} color="#f48024" />
            <Text style={[styles.stackTitleText, { color: colors.text }]}>stack overflow</Text>
          </View>

          <Text style={[styles.soQuestionTitle, { color: colors.text }]}>
            How to run GGUF models on mobile devices in offline environment?
          </Text>

          <View style={styles.soStats}>
            <Text style={[styles.soStatTxt, { color: colors.textTertiary }]}>Asked today</Text>
            <Text style={[styles.soStatTxt, { color: colors.textTertiary }]}>Viewed 1.2k times</Text>
          </View>

          <View style={[styles.gitDivider, { backgroundColor: colors.border }]} />

          {/* Question Body */}
          <View style={styles.soVoteBlock}>
            <View style={styles.votesCol}>
              <Icon name="caret-up-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.voteCount, { color: colors.text }]}>42</Text>
              <Icon name="caret-down-outline" size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.soBodyCol}>
              <Text style={[styles.soBodyTxt, { color: colors.textSecondary }]}>
                I am trying to run lightweight LLMs (0.5B to 1.5B) locally on iOS and Android. Are there any robust native SDKs that allow offline mmap-backed GGUF inference in React Native?
              </Text>
            </View>
          </View>

          {/* Answer Body */}
          <View style={[styles.soAnswerHeader, { backgroundColor: colors.success + '10', borderColor: colors.success + '40' }]}>
            <Icon name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.soAnswerTitleText, { color: colors.success }]}>Accepted Answer (108 upvotes)</Text>
          </View>
          <View style={styles.soVoteBlock}>
            <View style={styles.votesCol}>
              <Icon name="caret-up-outline" size={24} color={colors.success} />
              <Text style={[styles.voteCount, { color: colors.text }]}>108</Text>
              <Icon name="caret-down-outline" size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.soBodyCol}>
              <Text style={[styles.soBodyTxt, { color: colors.textSecondary }]}>
                You should use the <Text style={{ color: colors.primary, fontWeight: '700' }}>llama.rn</Text> package! It compiles llama.cpp natively using CMake for Android NDK and iOS CocoaPods, ensuring lightning-fast hardware acceleration.
              </Text>
              <View style={[styles.soCodeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.soCodeText, { color: colors.text, fontFamily: 'monospace' }]}>
                  {`import { LlamaContext } from 'llama.rn';\n\nconst context = await LlamaContext.init({\n  model: 'path/to/model.gguf',\n  useMmap: true,\n});`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // 4. MDN Web Docs Mock Page Layout
    if (domain.includes('mozilla.org')) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
          <View style={styles.mdnHeader}>
            <Text style={[styles.mdnLogoText, { color: colors.text }]}>mdn web docs</Text>
          </View>

          <Text style={[styles.mdnBreadcrumb, { color: colors.textTertiary }]}>References / Web APIs / Fetch</Text>
          <Text style={[styles.mdnHeadline, { color: colors.text }]}>Fetch API</Text>

          <View style={[styles.mdnAlert, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.mdnAlertText, { color: colors.primary }]}>
              The Fetch API provides an interface for fetching resources (including across the network). It will seem familiar to anyone who has used XMLHttpRequest.
            </Text>
          </View>

          <Text style={[styles.mdnSectionTitle, { color: colors.text }]}>Syntax Example</Text>
          <View style={[styles.soCodeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.soCodeText, { color: colors.text, fontFamily: 'monospace' }]}>
              {`fetch('https://api.github.com/repos/sarfaraz-78/PocketLLM')\n  .then(response => response.json())\n  .then(data => console.log(data));`}
            </Text>
          </View>
        </View>
      );
    }

    // 5. Generic Sandbox Portal Page View
    return (
      <View style={[styles.webBody, { backgroundColor: colors.surface }]}>
        <View style={styles.webContentBlock}>
          <Icon name="earth-outline" size={48} color={colors.primary} style={styles.earthLogo} />
          <Text style={[styles.webTitle, { color: colors.text }]}>
            {getDomainName(browserUrl).toUpperCase()}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.webDesc, { color: colors.textSecondary }]}>
            You have successfully navigated to <Text style={{ color: colors.primary, fontWeight: '700' }}>{browserUrl}</Text>.
          </Text>
          <Text style={[styles.webSubDesc, { color: colors.textTertiary }]}>
            This is a sandbox, secure mini-browser portal embedded within PocketLLM's agent environment. 
            The model can read webpage content, inspect elements, and query documents directly via tool invocations.
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleExternalOpen}
            activeOpacity={0.85}
          >
            <Icon name="open-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Launch in System Browser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Address Bar Row */}
      <View style={[styles.addressRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.urlBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Icon name={browserUrl.startsWith('https') ? 'lock-closed' : 'globe-outline'} size={14} color={colors.success} />
          <TextInput
            style={[styles.urlInput, { color: colors.text }]}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="Search or enter website name..."
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={() => handleNavigation(inputUrl)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            inputUrl.length > 0 && (
              <TouchableOpacity onPress={() => setInputUrl('')}>
                <Icon name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleNavigation(inputUrl)}
          style={[styles.goBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Icon name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExternalOpen} style={styles.externalBtn}>
          <Icon name="open-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bookmarks Horizontal Sliding bar */}
      <View style={[styles.bookmarksBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookmarksScroll}>
          {bookmarks.map((bm) => (
            <TouchableOpacity
              key={bm.id}
              onPress={() => handleNavigation(bm.url)}
              style={[
                styles.bookmarkPill,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                browserUrl === bm.url && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '08',
                },
              ]}
              activeOpacity={0.7}
            >
              <Icon
                name="bookmark"
                size={12}
                color={browserUrl === bm.url ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.bookmarkText,
                  { color: browserUrl === bm.url ? colors.primary : colors.text },
                ]}
              >
                {bm.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Simulated Web View Portal */}
      <View style={styles.viewport}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading secure page...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.simulatedPageContent}>
            {/* Browser Window Header */}
            <View style={[styles.webHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
                <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
                <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
              </View>
              <Text style={[styles.webDomain, { color: colors.textSecondary }]} numberOfLines={1}>
                {getDomainName(browserUrl)}
              </Text>
              <Icon name="refresh-outline" size={14} color={colors.textTertiary} />
            </View>

            {/* Page Body View */}
            {renderSimulatedPage()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  urlInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    paddingVertical: 0,
  },
  goBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalBtn: {
    padding: SPACING.xs,
  },
  bookmarksBar: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  bookmarksScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: 110,
  },
  bookmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  bookmarkText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  viewport: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  simulatedPageContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 110,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  webDomain: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  webBody: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  webContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  earthLogo: {
    marginVertical: SPACING.sm,
  },
  webTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: SPACING.xs,
  },
  webDesc: {
    fontSize: FONT_SIZES.md - 1,
    textAlign: 'center',
    lineHeight: 22,
  },
  webSubDesc: {
    fontSize: FONT_SIZES.sm - 1,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.sm,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  gitHubHeader: {
    gap: SPACING.xs,
  },
  gitHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gitHubRepoName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  gitPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  gitPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  gitHubStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  gitDivider: {
    height: 1,
    width: '100%',
    marginVertical: SPACING.md,
  },
  gitSubTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  gitFileList: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  gitFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  gitFileName: {
    fontSize: FONT_SIZES.sm - 1,
    fontWeight: '600',
    flex: 1,
  },
  gitCommit: {
    fontSize: FONT_SIZES.xs - 1,
    maxWidth: '50%',
  },
  readmeCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  readmeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  readmeTitleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  readmeBody: {
    padding: SPACING.md,
  },
  readmeHeadline: {
    fontSize: FONT_SIZES.md - 1,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  readmeParagraph: {
    fontSize: FONT_SIZES.sm - 1,
    lineHeight: 18,
  },
  googleSearchHeader: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  googleColorLogo: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  searchPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  searchPillVal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  googleDivider: {
    height: 1,
    width: '100%',
    marginVertical: SPACING.lg,
  },
  googleResults: {
    gap: SPACING.lg,
  },
  resultCard: {
    gap: 4,
  },
  resultUrl: {
    fontSize: 9,
    fontWeight: '600',
    color: '#202124',
  },
  resultTitle: {
    fontSize: FONT_SIZES.md - 1,
    fontWeight: '700',
    lineHeight: 20,
  },
  resultSnippet: {
    fontSize: FONT_SIZES.xs + 1,
    lineHeight: 18,
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  stackTitleText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  soQuestionTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  soStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  soStatTxt: {
    fontSize: 10,
  },
  soVoteBlock: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  votesCol: {
    alignItems: 'center',
    width: 32,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  soBodyCol: {
    flex: 1,
    gap: SPACING.md,
  },
  soBodyTxt: {
    fontSize: FONT_SIZES.sm - 1,
    lineHeight: 18,
  },
  soAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  soAnswerTitleText: {
    fontSize: FONT_SIZES.xs + 1,
    fontWeight: '800',
  },
  soCodeCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  soCodeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  mdnHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#212121',
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.md,
  },
  mdnLogoText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mdnBreadcrumb: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  mdnHeadline: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  mdnAlert: {
    borderLeftWidth: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  mdnAlertText: {
    fontSize: FONT_SIZES.xs + 1,
    lineHeight: 18,
  },
  mdnSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  localBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  localBannerText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  localWebContainer: {
    gap: SPACING.md,
  },
  localH1: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  localH2: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  localP: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  localButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  localButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  localDiv: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginVertical: 4,
  },
});


