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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';

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
  };
}

interface ParsedElement {
  tag: string;
  content: string;
  className: string;
  inlineStyle: string;
  children: ParsedElement[];
}

export const BrowserScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

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

  // Helper: CSS Style parser
  const parseCSS = (cssText: string): CSSStyles => {
    const styles: CSSStyles = {};
    try {
      const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
      let match;
      while ((match = ruleRegex.exec(cssText)) !== null) {
        const selector = match[1].trim();
        const declsText = match[2].trim();
        const declarations = declsText.split(';');
        const ruleStyles: any = {};

        declarations.forEach((decl) => {
          if (!decl.trim()) return;
          const [prop, val] = decl.split(':').map((s) => s.trim());
          if (!prop || !val) return;

          switch (prop.toLowerCase()) {
            case 'background-color':
              ruleStyles.backgroundColor = val;
              break;
            case 'color':
              ruleStyles.color = val;
              break;
            case 'font-size':
              ruleStyles.fontSize = parseInt(val, 10);
              break;
            case 'font-weight':
              ruleStyles.fontWeight = val === 'bold' ? 'bold' : 'normal';
              break;
            case 'margin-bottom':
              ruleStyles.marginBottom = parseInt(val, 10);
              break;
            case 'margin-top':
              ruleStyles.marginTop = parseInt(val, 10);
              break;
            case 'line-height':
              ruleStyles.lineHeight = parseFloat(val) * 12; // relative multiplier scale
              break;
            case 'padding':
              ruleStyles.padding = parseInt(val, 10);
              break;
            case 'border-radius':
              ruleStyles.borderRadius = parseInt(val, 10);
              break;
            case 'border':
              ruleStyles.borderWidth = 1;
              ruleStyles.borderColor = val.includes('#') ? '#' + val.split('#')[1].substring(0, 6) : '#cccccc';
              break;
          }
        });
        styles[selector] = ruleStyles;
      }
    } catch (e) {
      console.warn('Failed parsing local CSS rules', e);
    }
    return styles;
  };

  // Helper: Simple body parser that converts tags to list of elements
  const parseBodyElements = (bodyHtml: string): ParsedElement[] => {
    const elements: ParsedElement[] = [];
    try {
      // Regex matches nested tag elements like <h1>text</h1>, <div class="card">...</div>, etc.
      const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
      let match;
      while ((match = tagRegex.exec(bodyHtml)) !== null) {
        const tag = match[1].toLowerCase();
        const attribs = match[2];
        const content = match[3];

        const classMatch = attribs.match(/class=["']([^"']+)["']/);
        const styleMatch = attribs.match(/style=["']([^"']+)["']/);

        const className = classMatch ? classMatch[1] : '';
        const inlineStyle = styleMatch ? styleMatch[1] : '';

        // Recursively look for children if inside a div/container
        let children: ParsedElement[] = [];
        if (tag === 'div') {
          children = parseBodyElements(content);
        }

        elements.push({
          tag,
          content: content.replace(/<[^>]+>/g, '').trim(), // strip nested text tags for simple render
          className,
          inlineStyle,
          children,
        });
      }
    } catch (e) {
      console.warn('Failed parsing local HTML body tags', e);
    }
    return elements;
  };

  // Render Local Server Website Parser
  const renderLocalServer = () => {
    // Find index.html or first HTML file in workspace
    const htmlFile = files.find((f) => f.name.endsWith('.html')) || files.find((f) => f.language === 'html');
    if (!htmlFile || !htmlFile.content) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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

    const parsedElements = parseBodyElements(bodyHtml);

    // Dynamic style applier helper
    const getStylesForElement = (el: ParsedElement) => {
      let finalStyle: any = {};

      // 1. Tag base style
      if (cssRules[el.tag]) {
        finalStyle = { ...finalStyle, ...cssRules[el.tag] };
      }
      // 2. Class style
      if (el.className && cssRules['.' + el.className]) {
        finalStyle = { ...finalStyle, ...cssRules['.' + el.className] };
      }
      // 3. Inline style parser overrides
      if (el.inlineStyle) {
        el.inlineStyle.split(';').forEach((s) => {
          const parts = s.split(':');
          if (parts.length === 2) {
            const prop = parts[0].trim();
            const val = parts[1].trim();
            if (prop === 'color') finalStyle.color = val;
            if (prop === 'background-color') finalStyle.backgroundColor = val;
            if (prop === 'font-size') finalStyle.fontSize = parseInt(val, 10);
            if (prop === 'font-weight') finalStyle.fontWeight = val === 'bold' ? 'bold' : 'normal';
          }
        });
      }

      return finalStyle;
    };

    return (
      <View style={[styles.webBody, { backgroundColor: '#0b0f19' }, SHADOWS.sm]}>
        {/* Local live-reload banner */}
        <View style={[styles.localBanner, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Icon name="flash" size={14} color={colors.success} />
          <Text style={[styles.localBannerText, { color: colors.success }]}>
            LIVE PREVIEW: Port 3000 Active  ·  Auto reload enabled
          </Text>
        </View>

        {/* Dynamic elements mapper */}
        <View style={styles.localWebContainer}>
          {parsedElements.map((el, index) => {
            const elStyle = getStylesForElement(el);

            if (el.tag === 'h1') {
              return (
                <Text key={index} style={[styles.localH1, elStyle]}>
                  {el.content}
                </Text>
              );
            }
            if (el.tag === 'h2' || el.tag === 'h3') {
              return (
                <Text key={index} style={[styles.localH2, elStyle]}>
                  {el.content}
                </Text>
              );
            }
            if (el.tag === 'p') {
              return (
                <Text key={index} style={[styles.localP, elStyle]}>
                  {el.content}
                </Text>
              );
            }
            if (el.tag === 'button') {
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.localButton, elStyle]}
                  onPress={() => {
                    setButtonClicks((c) => c + 1);
                    Alert.alert(
                      'Live Interaction',
                      `You successfully clicked the "${el.content}" button!\nTotal Interactions: ${buttonClicks + 1}`
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.localButtonText}>{el.content}</Text>
                </TouchableOpacity>
              );
            }
            if (el.tag === 'div') {
              const divStyle = getStylesForElement(el);
              return (
                <View key={index} style={[styles.localDiv, divStyle]}>
                  {el.children.map((child, cIndex) => {
                    const childStyle = getStylesForElement(child);
                    if (child.tag === 'h3') {
                      return <Text key={cIndex} style={[styles.localH2, childStyle]}>{child.content}</Text>;
                    }
                    if (child.tag === 'p') {
                      return <Text key={cIndex} style={[styles.localP, childStyle]}>{child.content}</Text>;
                    }
                    if (child.tag === 'button') {
                      return (
                        <TouchableOpacity
                          key={cIndex}
                          style={[styles.localButton, childStyle]}
                          onPress={() => {
                            setButtonClicks((c) => c + 1);
                            Alert.alert(
                              'Live Interaction',
                              `Clicked inside div: "${child.content}"`
                            );
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.localButtonText}>{child.content}</Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })}
                </View>
              );
            }
            return null;
          })}
        </View>
      </View>
    );
  };

  const renderSimulatedPage = () => {
    const domain = getDomainName(browserUrl).toLowerCase();

    // Localhost Dev server HTML parsing engine
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return renderLocalServer();
    }

    // 1. GitHub Mock Page Layout
    if (domain.includes('github.com')) {
      return (
        <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
        <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
        <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
        <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
      <View style={[styles.webBody, { backgroundColor: colors.surface }, SHADOWS.sm]}>
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
            <View style={[styles.webHeader, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.xs]}>
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
    borderRadius: BORDER_RADIUS.md,
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
    borderRadius: BORDER_RADIUS.md,
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
  },
  bookmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
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
    paddingBottom: SPACING.huge,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.xl,
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
    borderRadius: BORDER_RADIUS.xl,
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
    borderRadius: BORDER_RADIUS.full,
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
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.full,
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
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  soAnswerTitleText: {
    fontSize: FONT_SIZES.xs + 1,
    fontWeight: '800',
  },
  soCodeCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.sm,
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
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.md,
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
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginVertical: 4,
  },
});