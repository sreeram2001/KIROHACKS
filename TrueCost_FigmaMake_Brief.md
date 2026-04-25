

**TrueCost Extension**

FigmaMake Design Brief

Hackathon Edition  ·  15 Screens  ·  4 Build Phases

*Build in order: Tokens → Base Components → Product Components → Screens*

| 1 | Design Tokens & Foundations Set these up first — everything else depends on them |
| :---: | :---- |

Set these up FIRST as local Figma styles before any components or screens.Use "Local Styles" panel. These tokens are the single source of truth for everycomponent in this file. Do not hardcode any hex values in components.

### **Color tokens**

| Create a Color Styles page titled "TrueCost — Color Tokens". |
| :---- |
|   |
| BRAND: |
|   brand/navy          \#0F1F3D  — primary backgrounds, sidebar, headers |
|   brand/teal          \#00C9B1  — CTAs, active states, highlights |
|   brand/teal-light    \#E6FAF8  — tinted backgrounds, selected states |
|   brand/teal-dark     \#009E8C  — teal hover states |
|   |
| NEUTRALS: |
|   neutral/white       \#FFFFFF  — card backgrounds, text on dark |
|   neutral/50          \#F5F7FA  — page backgrounds |
|   neutral/100         \#EAECF0  — dividers, borders |
|   neutral/200         \#D0D5DD  — input borders, disabled states |
|   neutral/400         \#98A2B3  — placeholder text, secondary labels |
|   neutral/600         \#475467  — body text secondary |
|   neutral/900         \#101828  — primary body text |
|   |
| SEMANTIC: |
|   semantic/success        \#12B76A  — positive savings, verified badges |
|   semantic/success-light  \#ECFDF3  — success backgrounds |
|   semantic/warning        \#F79009  — fair TEC scores, caution alerts |
|   semantic/warning-light  \#FFFAEB  — warning backgrounds |
|   semantic/error          \#F04438  — bad deals, cancel alerts, errors |
|   semantic/error-light    \#FEF3F2  — error backgrounds |
|   semantic/info           \#2E90FA  — informational states |
|   semantic/info-light     \#EFF8FF  — info backgrounds |
|   |
| TEC SCORE SCALE: |
|   tec/excellent   \#027A48  score 85–100 |
|   tec/good        \#12B76A  score 70–84 |
|   tec/fair        \#F79009  score 50–69 |
|   tec/poor        \#EF6820  score 30–49 |
|   tec/bad         \#F04438  score 0–29 |

### **Typography tokens**

| Create a Text Styles page titled "TrueCost — Typography". |
| :---- |
| Primary typeface: DM Sans. Numbers/prices: DM Mono. |
|   |
| DISPLAY: |
|   display/xl   36px  Bold 700    line-height 44px  — hero headlines |
|   display/lg   30px  Bold 700    line-height 38px  — page titles |
|   display/md   24px  SemiBold    line-height 32px  — section headers |
|   display/sm   20px  SemiBold    line-height 28px  — card titles |
|   |
| TEXT: |
|   text/lg   18px  Regular 400  line-height 28px  — large body |
|   text/md   16px  Regular 400  line-height 24px  — default body |
|   text/sm   14px  Regular 400  line-height 20px  — secondary text, labels |
|   text/xs   12px  Regular 400  line-height 18px  — captions, timestamps |
|   |
| LABELS (medium weight, UI controls): |
|   label/lg   16px  Medium 500  line-height 24px  — button labels large |
|   label/md   14px  Medium 500  line-height 20px  — button labels medium |
|   label/sm   12px  Medium 500  line-height 18px  — button labels small, chips |
|   |
| MONO (DM Mono — prices and scores): |
|   mono/lg   18px  SemiBold 600  line-height 28px  — TEC scores, large prices |
|   mono/md   14px  Regular 400   line-height 20px  — smaller prices, numbers |

### **Spacing, radius & shadow tokens**

| Create a Spacing & Effects reference frame. |
| :---- |
|   |
| SPACING SCALE (label each as a colored rectangle): |
|   4px / 8px / 12px / 16px / 20px / 24px / 32px / 40px / 48px / 64px / 80px / 96px |
|   |
| BORDER RADIUS SCALE: |
|   none  0px     xs   4px     sm  8px |
|   md    12px    lg   16px    xl  24px    full  9999px |
|   |
| SHADOW EFFECTS (set as Figma Effect Styles): |
|   shadow/xs  — 0 1px 2px rgba(16,24,40,0.05) |
|   shadow/sm  — 0 1px 3px rgba(16,24,40,0.10), 0 1px 2px rgba(16,24,40,0.06) |
|   shadow/md  — 0 4px 8px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.04) |
|   shadow/lg  — 0 12px 16px rgba(16,24,40,0.08), 0 4px 6px rgba(16,24,40,0.03) |
|   shadow/xl  — 0 20px 24px rgba(16,24,40,0.08), 0 8px 8px rgba(16,24,40,0.03) |

| 2 | Base & Feedback Components Block on Phase 1 — use tokens only, no hardcoded hex |
| :---: | :---- |

## **Base components**

### **Buttons**

| Design a Button component with Auto Layout and the following variant matrix. |
| :---- |
|   |
| VARIANT — Type: |
|   Primary        solid brand/teal background, white label |
|   Secondary      white background, brand/teal border, brand/teal label |
|   Ghost          transparent background, brand/navy label, no border |
|   Destructive    solid semantic/error background, white label |
|   Destr. Outline white background, semantic/error border and label |
|   Link           no background, no border, brand/teal underline label |
|   |
| VARIANT — Size: |
|   Large   48px height, 16px h-padding, label/lg |
|   Medium  40px height, 14px h-padding, label/md |
|   Small   32px height, 12px h-padding, label/sm |
|   |
| VARIANT — State: |
|   Default | Hover (10% darker bg) | Focused (4px teal outline ring) |
|   Disabled (40% opacity, no pointer) | Loading (spinner dots replace label) |
|   |
| VARIANT — Icon: |
|   No icon | Icon Left | Icon Right | Icon Only (square) |
|   |
| Use border-radius: full (9999px). Apply brand tokens only — no hardcoded hex. |

### **Input fields**

| Design a Text Input component with Auto Layout. |
| :---- |
|   |
| VARIANT — Type: |
|   Text       standard single line |
|   Password   show/hide eye icon toggle right |
|   Search     magnifier icon left, optional clear X right |
|   Prefix     "$" symbol inside left edge |
|   Suffix     unit label "per year" inside right edge |
|   Textarea   multi-line, resize handle bottom-right |
|   |
| VARIANT — State: |
|   Default | Focused | Filled | Error | Disabled | Read-only |
|   |
| ANATOMY (top to bottom): |
|   Label text (text/sm, neutral/600) — optional slot |
|   Input field 44px height, border-radius sm (8px) |
|   Helper text (text/xs, neutral/400) — turns semantic/error in error state |
|     with warning icon left |
|   |
| BORDER COLORS: |
|   Default → neutral/200 |
|   Focused → brand/teal |
|   Error   → semantic/error |
|   |
| Apply brand tokens only — no hardcoded hex. |

### **Dropdowns & selects**

| Design a Select / Dropdown component. |
| :---- |
|   |
| Closed state: identical appearance to a filled Input, chevron-down icon right. |
|   |
| Open state: floating menu panel below (flip above if near viewport bottom). |
|   Panel: white bg, shadow/lg, border-radius md, border neutral/100. |
|   Option row: 40px tall, 16px h-padding. |
|   Option states: Default | Hover (brand/teal-light bg) | Selected (teal left border 3px \+ teal label \+ checkmark right) |
|   |
| VARIANT — Multi-select: |
|   Selected items render as removable chips inside the input field. |
|   |
| VARIANT — Searchable: |
|   Search field at top of open panel for long lists. |

### **Checkboxes & radio buttons**

| Design Checkbox and Radio Button components. |
| :---- |
|   |
| CHECKBOX — 16×16px, border-radius 4px: |
|   Unchecked | Checked (teal fill \+ white checkmark) | Indeterminate (teal fill \+ white dash) |
|   Disabled Unchecked | Disabled Checked |
|   |
| RADIO — 16×16px, border-radius full: |
|   Unselected | Selected (teal outer ring \+ teal inner dot) | Disabled |
|   |
| ANATOMY: component label to the right, optional helper text below. |
| Auto Layout so label wraps correctly at any width. |

### **Toggle switch**

| Design a Toggle Switch component. |
| :---- |
|   |
| Track: 44×24px  Thumb: 20px circle with subtle drop shadow |
| States: Off (neutral/200 track, white thumb) | On (teal track, white thumb) |
|         Disabled Off | Disabled On |
|   |
| Size variant: |
|   Default  44×24px |
|   Small    36×20px |
|   |
| Include label to the right and optional sub-label below. |
| Used for membership toggles, notification preferences, status selections. |

### **Chips & tags**

| Design a Chip / Tag component set with Auto Layout. |
| :---- |
|   |
| FILTER CHIP (dashboard filters) — 32px height, 12px h-padding, border-radius full: |
|   Unselected: white bg, neutral/200 border, neutral/600 label |
|   Selected:   teal-light bg, brand/teal border, brand/teal label \+ checkmark left |
|   |
| STATUS BADGE (TEC labels, verification status) — 22px height, 8px h-padding: |
|   Success (green) | Warning (amber) | Error (red) | Info (blue) | Neutral (gray) |
|   Small status dot or icon left \+ label text |
|   |
| IDENTITY BADGE (profile verified statuses) — 28px height: |
|   Icon left (graduation cap, shield, heart, etc.) |
|   Label \+ verified checkmark right |
|   brand/teal border, teal-light background |
|   |
| REMOVABLE TAG (multi-select inputs): |
|   Label \+ X icon, teal-light background, border-radius full |

### **Avatars**

| Design an Avatar component. |
| :---- |
|   |
| SIZES: XS 24px | SM 32px | MD 40px | LG 48px | XL 64px | 2XL 80px |
|   |
| TYPES: |
|   Image     circular photo |
|   Initials  brand/navy background, white 2-letter initials |
|   Icon      neutral/100 background, person icon |
|   |
| STATUS INDICATOR (optional, bottom-right, 25% of avatar diameter): |
|   Online (semantic/success green) | Offline (neutral/400) | Away (semantic/warning) |
|   |
| GROUP AVATAR: 3 overlapping avatars \+ "+N" overflow chip. |
| Border-radius: full for all sizes. |

## **Feedback & overlay components**

### **Toast notifications**

| Design a Toast Notification component. |
| :---- |
| Width: 360px, Auto Layout, 16px padding, border-radius 12px, shadow/lg. |
| Position: bottom-center of screen. |
|   |
| VARIANTS: |
|   Success  — semantic/success left border 4px, checkmark icon |
|   Warning  — semantic/warning left border 4px, warning triangle icon |
|   Error    — semantic/error left border 4px, X icon |
|   Info     — semantic/info left border 4px, info circle icon |
|   |
| ANATOMY (left to right): |
|   Icon (24px, semantic color) | Title bold text/sm | Message text/sm neutral/600 |
|   Optional action link right-aligned | X dismiss button top-right |
|   |
| STACKED STATE: 2 toasts visible, second scaled down 95% behind first. |

### **Modals & dialogs**

| Design a Modal / Dialog component with Auto Layout. |
| :---- |
|   |
| WIDTHS: Small 360px | Default 480px | Large 640px |
|   |
| ANATOMY (top to bottom): |
|   Optional icon/illustration (48px icon in colored circle, centered) |
|   Title (display/sm, brand/navy) |
|   Body text (text/md, neutral/600) |
|   Optional content slot (forms, lists, scrollable area) |
|   Footer: 1–2 buttons right-aligned (stacked full-width on mobile) |
|   Close X button top-right corner |
|   |
| OVERLAY: rgba(16,24,40,0.6) background scrim |
|   |
| VARIANTS: |
|   Informational      info icon, teal primary button |
|   Confirmation       warning/trash icon, semantic/error primary button (destructive) |
|   Form modal         scrollable content area, divider above footer |

### **Skeleton loaders**

| Design Skeleton Loader components. |
| :---- |
|   |
| All skeletons: neutral/100 base, animated shimmer (light gray → white → light gray, sweeping left to right). No colors, no icons — pure shape only. |
|   |
| CREATE THESE SKELETONS: |
|   Text line          single line, variants at 100% / 75% / 50% width |
|   Text block         3 lines (100%, 85%, 60%) |
|   Card               image placeholder top \+ 3 text lines |
|   Table row          5 column cells |
|   Stat card          label line \+ large value \+ small trend line |
|   Extension overlay  full skeleton matching the 380px extension panel layout |
|                      (header bar \+ 5 cost breakdown lines \+ 3 alternative cards) |

| 3 | Product-Specific Components Block on Phase 2 — build these before any screens |
| :---: | :---- |

## **Data display components**

### **TEC Score Badge (key component)**

| Design the TEC Score Badge as a master Figma component with variants. |
| :---- |
|   |
| SIZES: Large 56px | Medium 36px | Small 24px |
|   |
| STRUCTURE: |
|   Circular SVG progress ring, stroke width proportional to size |
|   Score number centered, mono/lg (large) or mono/md (smaller) |
|   Thin background ring neutral/100 |
|   Ring fills clockwise from top, proportional to score (e.g. 92/100 \= 92% filled) |
|   |
| SCORE VARIANTS (use tec/ color tokens): |
|   Excellent  tec/excellent  score 85–100 |
|   Good       tec/good       score 70–84 |
|   Fair       tec/fair       score 50–69 |
|   Poor       tec/poor       score 30–49 |
|   Bad        tec/bad        score 0–29 |
|   |
| ALSO DESIGN: TEC Score Card (200px wide horizontal) |
|   Badge (small) left \+ score label \+ one-line verdict right |
|   Verdicts: "Great deal" / "Fair price" / "Overpriced" / "Check alternatives" |
|   Used in extension overlay header. |
|   |
| Build all size × score combinations as component variants. |

### **Stat cards**

| Design a Stat Card component with Auto Layout. |
| :---- |
| Minimum width: 200px. |
|   |
| ANATOMY (top to bottom): |
|   Optional icon top-right (24px, brand/teal in teal-light circle) |
|   Label (text/sm, neutral/400) |
|   Value (display/lg, brand/navy, DM Mono font for numbers) |
|   Optional trend indicator (up/down arrow \+ % in semantic/success or semantic/error, text/sm) |
|   |
| VARIANTS: |
|   Default        no trend indicator |
|   Positive trend green upward arrow \+ percentage |
|   Negative trend red downward arrow \+ percentage |
|   Neutral        flat dash, neutral/400 |

### **Data table**

| Design a Data Table component. |
| :---- |
|   |
| HEADER ROW: 44px, neutral/50 bg, label/sm text, neutral/600, sort arrows (active arrow in brand/teal) |
| DATA ROWS: 52px, white bg, text/sm, neutral/900 |
| ALTERNATING: every other row neutral/50 bg |
| HOVER STATE: neutral/100 bg |
| SELECTED STATE: teal-light bg, brand/teal left border 3px |
|   |
| VARIANTS: |
|   Default          standard rows |
|   With checkbox    leftmost column is checkbox (16px) |
|   With sparkline   one cell contains inline 80×28px sparkline chart |
|   Mobile           cards stacked vertically, each card \= label–value pairs |
|   |
| PAGINATION CONTROLS (below table): |
|   Previous/Next buttons \+ page number chips |

### **Sparkline chart**

| Design a Sparkline Chart component — 120×40px, no axes, no labels. |
| :---- |
|   |
| VARIANTS: |
|   Trending up    brand/teal line, teal gradient fill 15% opacity below |
|   Trending down  semantic/error red line, red gradient fill 15% opacity |
|   Flat/volatile  neutral/400 gray line, gray gradient fill |
|   |
| HOVER STATE: small dot on line at cursor position \+ tooltip with value |
|   |
| Used inline in table cells and chatbot message bubbles. |

## **Navigation components**

### **Sidebar navigation**

| Design a Sidebar Navigation component for the TrueCost dashboard. |
| :---- |
|   |
| WIDTH: 240px expanded | 64px collapsed |
| BACKGROUND: brand/navy |
|   |
| NAV ITEM (48px tall, 16px h-padding): |
|   Icon 24px (white default, brand/teal active) \+ label (label/md, white) |
|   States: |
|     Default  transparent bg |
|     Hover    white at 8% opacity |
|     Active   teal-light bg, brand/teal left border 3px, teal icon \+ label |
|   |
| NAV ITEMS TO SHOW: |
|   Overview | Decision History | Memberships | Alerts | Ethics Log |
|   |
| FOOTER: user avatar (initials) \+ display name \+ "Settings" text link |
|   |
| COLLAPSED VARIANT: icons only, tooltips on hover |
|   |
| EXPAND/COLLAPSE: toggle button at top or bottom of sidebar |

### **Top navigation bar**

| Design a Top Navigation Bar for the TrueCost dashboard. |
| :---- |
|   |
| Full width, 64px height, white background, bottom border neutral/100. |
|   |
| LEFT:   TrueCost logo \+ wordmark (brand/navy) |
| CENTER: Search bar 480px wide (search input variant) |
| RIGHT:  Notification bell icon with red dot badge (unread count) |
|         User avatar (40px initials) \+ dropdown chevron |
|   |
| DROPDOWN MENU (triggered from avatar, 200px wide, shadow/lg): |
|   My Profile | Settings | Help | Sign Out |
|   Each item 40px tall, hover neutral/50 bg |

## **Extension-specific components**

### **Extension panel header**

| Design the Extension Panel Header for the TrueCost browser extension overlay. |
| :---- |
|   |
| DIMENSIONS: 380px wide, 56px height |
| BACKGROUND: brand/navy |
|   |
| LAYOUT (left to right): |
|   Left:   TrueCost wordmark (white, small) |
|   Center: TEC Score Card component (badge \+ verdict label) |
|   Right:  minimize chevron icon (white, 20px) \+ settings gear icon (white, 20px) |
|   |
| SEPARATOR: 2px teal gradient line immediately below the header bar |

### **Alternative product card**

| Design an Alternative Product Card for the extension overlay horizontal scroll row. |
| :---- |
|   |
| DIMENSIONS: 160×120px |
| STYLE: white bg, border-radius 12px, shadow/sm, 12px padding, Auto Layout |
|   |
| LAYOUT (top to bottom): |
|   Platform logo 32×16px, left-aligned |
|   Price mono/lg brand/navy \+ TEC Score Badge (small 24px) right-aligned, same row |
|   Product name text/sm, single line truncated with ellipsis |
|   "Switch" button (Small, Secondary style, full width) |
|   |
| STATES: |
|   Default    white bg, shadow/sm |
|   Hover      shadow/md, brand/teal border |
|   Best Deal  teal top border 3px \+ "Best Deal" chip overlapping top-left corner |

### **Chatbot message bubbles**

| Design Chat Message Bubble components for the TrueCost chatbot drawer. |
| :---- |
|   |
| USER BUBBLE: right-aligned |
|   Background: brand/teal  |  Text: white  |  text/sm |
|   Border-radius: 12px top-left, 12px top-right, 12px bottom-left, 0 bottom-right |
|   Max width: 240px |
|   |
| BOT BUBBLE: left-aligned |
|   Background: neutral/50  |  Text: brand/navy  |  text/sm |
|   Border-radius mirrored from user bubble |
|   24px TrueCost logo avatar to the left |
|   Max width: 280px |
|   VARIANT A: embedded sparkline chart (120×40px) inside bubble below text |
|   VARIANT B: "See alternatives" action button below text (Secondary Small style) |
|   |
| TYPING INDICATOR: bot bubble style, three animated dots inside |

### **Ethics alert banner**

| Design an Inline Ethics Alert Banner for the extension overlay. |
| :---- |
|   |
| This is NOT a modal — it slides in between the header and cost breakdown. |
| Full width 380px, auto height, brand/warning-light (\#FFFAEB) background, |
| border-radius 12px, 12px padding. |
|   |
| LAYOUT (left to right): |
|   Warning triangle icon (semantic/warning amber, 20px) left |
|   Bold short headline \+ one-line description center |
|   "Details" text link \+ X dismiss button right |
|   |
| COLLAPSED STATE: as described above |
| EXPANDED STATE: clicking "Details" reveals 3–4 line explanation below the headline row |
| DISMISS: smooth collapse animation on X click |

## **Form / onboarding components**

### **Identity selection card**

| Design an Identity Selection Card for the "What describes you?" onboarding step. |
| :---- |
|   |
| DIMENSIONS: 160×100px |
| STYLE: white bg, neutral/200 border, border-radius 12px, 16px padding, Auto Layout centered |
|   |
| LAYOUT: |
|   Icon top center (32px, neutral/400 default) |
|   Label bottom center (label/md, neutral/700) |
|   |
| STATES: |
|   Default   white bg, neutral/200 border |
|   Hover     neutral/50 bg, neutral/400 border |
|   Selected  teal-light bg, brand/teal border 2px, teal icon, teal label, |
|             brand/teal checkmark badge top-right corner |
|   Disabled  40% opacity |
|   |
| IDENTITY CARDS TO SHOW: |
|   Student | Veteran / Active Military | Senior Citizen (65+) |
|   Healthcare Worker | Teacher / Educator | Government Employee | None of the above |

### **File upload dropzone**

| Design a File Upload Dropzone component for the ID verification flow. |
| :---- |
|   |
| STATES: |
|   |
| Default: |
|   Dashed neutral/200 border, neutral/50 bg |
|   Center content: upload cloud icon in teal-light circle (48px) |
|   "Drag and drop your file here" label/md |
|   "or Browse files" brand/teal link below |
|   Accepted formats note text/xs neutral/400 |
|   |
| Drag-over: |
|   Brand/teal dashed border, teal-light bg, icon color shifts to brand/teal |
|   |
| Uploaded: |
|   Solid neutral/200 border |
|   File icon \+ filename (text/sm) \+ file size (text/xs neutral/400) \+ red X remove button |
|   |
| Error: |
|   Semantic/error dashed border, error-light bg, error message text/xs below |

### **Verification status banner**

| Design a Verification Status Banner for the profile page. |
| :---- |
| Full width of container, 48px height, border-radius 8px. |
|   |
| VARIANT — Verified: |
|   semantic/success-light bg, checkmark icon left |
|   "Student Status — Verified" label/md |
|   "View details" teal text link right |
|   |
| VARIANT — Pending: |
|   semantic/warning-light bg, clock icon left |
|   "Military Status — Under Review (2–3 business days)" label/md |
|   |
| VARIANT — Failed: |
|   semantic/error-light bg, X icon left |
|   "Verification Failed — Please resubmit" label/md |
|   "Try again" button (Small, Destructive Outline style) right |

| 4 | Screens (15 Total) Block on Phase 3 — assemble from components built above |
| :---: | :---- |

## **Extension overlay screens**

| S1 | Extension Overlay — Product Page (Main Panel) | ORIGINAL |
| ----- | :---- | :---: |
| Design a browser extension overlay panel appearing on e-commerce product pages. |  |  |
|   |  |  |
| CONTAINER: floating card, 380px wide, white bg, shadow/lg, border-radius 16px, |  |  |
| anchored right side of viewport. |  |  |
|   |  |  |
| HEADER: use Extension Panel Header component (navy, TrueCost logo \+ TEC Score Card \+ icons) |  |  |
|   |  |  |
| COST BREAKDOWN SECTION (card-within-card): |  |  |
|   Line items with icon \+ label left, price right (DM Mono): |  |  |
|     Base price |  |  |
|     Estimated tax |  |  |
|     Shipping |  |  |
|     Return friction cost |  |  |
|   ─────────────────────────────── |  |  |
|   Total Economic Cost   bold, brand/navy, larger font |  |  |
|   |  |  |
| ALTERNATIVES SECTION: |  |  |
|   Section header "Alternatives" text/sm label |  |  |
|   Horizontal scroll row of 2–3 Alternative Product Card components |  |  |
|   |  |  |
| CHATBOT INPUT BAR (bottom): |  |  |
|   Full-width text input, placeholder "Ask TrueCost anything about this product…" |  |  |
|   Send icon button right (brand/teal) |  |  |
|   |  |  |
| Color palette: brand/navy, brand/teal, white, neutral/50. |  |  |

| S2 | Ethics Gate Alert Modal | ORIGINAL |
| ----- | :---- | :---: |
| Design a modal overlay triggered when the TrueCost Ethics Gate fires. |  |  |
|   |  |  |
| CONTAINER: centered modal, 340px wide, semantic/warning-light bg (\#FFF3CD), |  |  |
| border-radius 16px, shadow/xl. Use faux-viewport wrapper for height. |  |  |
|   |  |  |
| LAYOUT (top to bottom): |  |  |
|   Warning triangle icon (48px, amber circle bg) centered top |  |  |
|   Headline: "Pricing Concern Detected" display/sm brand/navy bold |  |  |
|   2–3 lines explanation text/md neutral/600 |  |  |
|   Example: "This item is priced 34% higher than its 90-day average — |  |  |
|            this may be artificial urgency pricing." |  |  |
|   |  |  |
| BUTTONS (stacked, full width): |  |  |
|   "See Alternatives"   Primary teal button |  |  |
|   "Proceed Anyway"     Ghost button neutral |  |  |
|   |  |  |
| FOOTER: "Learn more about our ethics policy" text/xs teal link centered |  |  |
|   |  |  |
| Rounded corners, shadow/xl, no harsh borders. |  |  |

| S3 | Chatbot Panel — Expanded State | ORIGINAL |
| ----- | :---- | :---: |
| Design the expanded chatbot drawer sliding up from the extension overlay bottom. |  |  |
|   |  |  |
| CONTAINER: 380px wide, 320px tall, white bg, border-radius 16px top corners, |  |  |
| drag handle centered at top (40px wide, 4px tall, neutral/200, border-radius full). |  |  |
|   |  |  |
| CONVERSATION THREAD (scrollable): |  |  |
|   Use Chatbot Message Bubble components. |  |  |
|   Show this example exchange: |  |  |
|     BOT:  "Hi\! I can help you decide. What would you like to know?" |  |  |
|     USER: "Is this a good time to buy?" |  |  |
|     BOT:  "Price has been fairly stable over 90 days — the current price is near |  |  |
|            the average. Not an urgent buy, but not a bad time either." |  |  |
|            \[embedded Sparkline Chart component below bot message\] |  |  |
|   |  |  |
| INPUT BAR (pinned bottom): |  |  |
|   Text input field with placeholder "Ask anything…" |  |  |
|   Microphone icon left | Send button right (brand/teal) |  |  |
|   |  |  |
| Conversational tone — feels like a smart assistant, not a support chat. |  |  |

| S13 | Loading / Processing State | NEW |
| ----- | :---- | :---: |
| Design the Loading State for the TrueCost extension overlay while the TEC Engine runs. |  |  |
|   |  |  |
| CONTAINER: same 380px floating card as the main overlay. |  |  |
|   |  |  |
| HEADER: normal Extension Panel Header (not skeletonized) |  |  |
|   |  |  |
| LOADING BAR: 2px teal animated progress bar at the very top of the panel |  |  |
|   Use indeterminate Progress Bar component variant |  |  |
|   |  |  |
| STATUS MESSAGE (below header, text/sm neutral/600 centered, animated text cycle): |  |  |
|   "Scanning product data…" |  |  |
|   → "Checking your memberships…" |  |  |
|   → "Finding alternatives…" |  |  |
|   → "Running ethics check…" |  |  |
|   |  |  |
| SKELETON SECTION: use Extension Overlay Skeleton component for cost breakdown area |  |  |
|   Animated shimmer gray bars in place of all line items |  |  |
|   |  |  |
| CHATBOT AREA (bottom): Typing Indicator bubble variant (3 animated dots) |  |  |
|   |  |  |
| Should feel fast and intelligent. No generic spinner. No blank white areas. |  |  |

| S15 | Error State — Product Not Recognized | NEW |
| ----- | :---- | :---: |
| Design the Error/Fallback state for the extension overlay when a page can't be analyzed. |  |  |
|   |  |  |
| CONTAINER: same 380px floating card, with Extension Panel Header at top (normal state). |  |  |
|   |  |  |
| MAIN AREA (centered, replaces cost breakdown): |  |  |
|   "?" icon in neutral/100 circle (48px icon, 80px circle) |  |  |
|   "We couldn't analyze this page" text/md brand/navy bold |  |  |
|   "This might be a page we don't support yet, or the product data wasn't readable." |  |  |
|   text/sm neutral/600 centered |  |  |
|   |  |  |
| TWO OPTIONS: |  |  |
|   "Report this page"         text/sm teal link |  |  |
|   "Try the chatbot instead"  Secondary Small button (opens chat drawer) |  |  |
|   |  |  |
| Keep it non-alarming and helpful. Do not use semantic/error red — use neutral tones. |  |  |
| This is an edge case, not a failure. |  |  |

## **Dashboard screens**

| S4 | Dashboard — Profile Home | ORIGINAL |
| ----- | :---- | :---: |
| Design the TrueCost "My Dashboard" full-page screen. |  |  |
| FRAME SIZES: Desktop 1440px \+ Mobile 390px (show both). |  |  |
|   |  |  |
| LAYOUT — Desktop: |  |  |
|   Left: Sidebar Navigation component (240px, brand/navy) |  |  |
|   Top: Top Navigation Bar component |  |  |
|   Main: white / neutral/50 background |  |  |
|   |  |  |
| MAIN CONTENT: |  |  |
|   1\. Summary stat row (3 Stat Card components): |  |  |
|        "Total Saved This Year"  $342  semantic/success positive trend |  |  |
|        "Decisions Tracked"      47    neutral |  |  |
|        "Active Memberships"     3     neutral |  |  |
|   |  |  |
|   2\. Decision History section: |  |  |
|      Filter chips row: Category | Platform | Savings Type | Time Period |  |  |
|      Data Table component with columns: |  |  |
|        Date | Product | Platform | What You Paid | TEC Score | Savings |  |  |
|      TEC Score column uses TEC Score Badge (small) |  |  |
|      Savings column uses Sparkline (inline) |  |  |
|      Alternating row shading, hover state |  |  |
|   |  |  |
| MOBILE: sidebar collapses to bottom tab bar (5 icons). |  |  |

| S5 | Membership ROI Card | ORIGINAL |
| ----- | :---- | :---: |
| Design a Membership ROI Card component — 360px wide. |  |  |
|   |  |  |
| STYLE: white bg, border-radius 16px, shadow/sm, thin left border in membership brand color. |  |  |
|   |  |  |
| LAYOUT (top to bottom): |  |  |
|   Membership logo (32px) \+ membership name display/sm brand/navy |  |  |
|   |  |  |
|   COMPARISON BAR (use Comparison Bar component): |  |  |
|     "Value Received"  brand/teal bar |  |  |
|     "Annual Cost"     brand/navy bar |  |  |
|     Both share max width \= higher value at 100% |  |  |
|     Bar height: 8px, border-radius full |  |  |
|   |  |  |
|   LINE ITEMS (text/sm, mono/md for values): |  |  |
|     Total Value Received    $187 |  |  |
|     Annual Cost             $139 |  |  |
|     Net Value               \+$48  bold semantic/success green |  |  |
|   |  |  |
|   FOOTER: "Renewal in 47 days" neutral/400 text/xs tag |  |  |
|           "Manage" brand/teal text link right |  |  |
|   |  |  |
| Design as a reusable Auto Layout component — works for any membership. |  |  |

| S6 | Renewal Alert Notification | ORIGINAL |
| ----- | :---- | :---: |
| Design a Renewal Alert Notification card for the dashboard Alerts section. |  |  |
|   |  |  |
| DIMENSIONS: 600px wide |  |  |
| STYLE: semantic/error-light bg (\#FFF0F0), left border 4px semantic/error red, |  |  |
| border-radius 12px, 16px padding. |  |  |
|   |  |  |
| LAYOUT: |  |  |
|   Bell icon (semantic/error, 24px) left-aligned |  |  |
|   Headline bold: "Walmart+ Renewal in 14 Days" label/lg brand/navy |  |  |
|   Description (text/sm neutral/600, 2 lines): |  |  |
|     "Based on your usage, this membership saved you $23 this year — |  |  |
|      less than the $98 annual fee. You may want to reconsider." |  |  |
|   |  |  |
| ACTIONS: |  |  |
|   "Cancel Membership"  Destructive Outline button |  |  |
|   "Keep It"            Ghost button |  |  |
|   "View full usage breakdown →"  text/xs teal link below |  |  |
|   |  |  |
| Tone: urgent but not alarming — informative and empowering. |  |  |

| S12 | User Profile Page | NEW |
| ----- | :---- | :---: |
| Design a full User Profile page within the dashboard layout (with sidebar \+ top nav). |  |  |
|   |  |  |
| PROFILE HEADER CARD: |  |  |
|   Avatar (LG 48px, initials-based) left |  |  |
|   Display name display/md brand/navy |  |  |
|   Email text/sm neutral/600 |  |  |
|   "Member since January 2024" text/xs neutral/400 |  |  |
|   |  |  |
| VERIFIED STATUSES SECTION: |  |  |
|   Section label "Verified Statuses" text/sm bold neutral/600 uppercase |  |  |
|   Identity Badge chips for each verified status: |  |  |
|     e.g. graduation cap \+ "Student — Verified" \+ checkmark |  |  |
|          shield \+ "Veteran — Verified" \+ checkmark |  |  |
|   "Add status" text link brand/teal |  |  |
|   |  |  |
| CONNECTED CARDS SECTION: |  |  |
|   Section label "Payment Cards" |  |  |
|   Card rows: card type icon \+ masked number (••••1234) \+ cashback rate chip |  |  |
|   "+ Add card" text link |  |  |
|   |  |  |
| MEMBERSHIPS SECTION: |  |  |
|   Compact list: logo \+ name \+ status pill (active/inactive) \+ "Manage" link per row |  |  |
|   |  |  |
| ACCOUNT SETTINGS (bottom, divider above): |  |  |
|   Notification Preferences | Privacy Settings | Data Export |  |  |
|   "Delete Account" text/xs neutral/400 (present but not prominent) |  |  |
|   |  |  |
| Full-width layout, white card sections with neutral/50 page background. |  |  |

| S14 | Empty State — First-Time Dashboard | NEW |
| ----- | :---- | :---: |
| Design the Empty State for the dashboard when a new user has no history yet. |  |  |
|   |  |  |
| Use full dashboard layout (sidebar \+ top nav). Main area is the empty state. |  |  |
|   |  |  |
| CENTER CONTENT (vertically \+ horizontally centered in main area): |  |  |
|   Abstract geometric illustration — shapes suggesting a shopping bag and a checkmark. |  |  |
|   Use brand/teal and brand/navy only. No literal shopping imagery. |  |  |
|   Illustration: \~200px tall |  |  |
|   |  |  |
|   Headline: "Your savings story starts here" display/md brand/navy |  |  |
|   Sub-text: "Browse a product on Amazon, Walmart, or Target and TrueCost will analyze it." |  |  |
|             text/md neutral/600 |  |  |
|   |  |  |
| TWO ACTION CARDS (side by side, 220px wide each): |  |  |
|   "Browse a product" |  |  |
|     Link icon |  |  |
|     "Opens in a new tab" text/xs neutral/400 |  |  |
|     Secondary button "Go shopping" |  |  |
|   |  |  |
|   "See how it works" |  |  |
|     Play button icon |  |  |
|     "2-minute demo" text/xs neutral/400 |  |  |
|     Ghost button "Watch demo" |  |  |
|   |  |  |
| Encouraging, welcoming tone — not an error state. Plenty of white space. |  |  |

## **Auth & onboarding flow**

| S9 | Login / Signup Screen | NEW |
| ----- | :---- | :---: |
| Design an Authentication screen — 480px centered card on neutral/50 page bg. |  |  |
|   |  |  |
| HEADER: TrueCost logo \+ wordmark centered top. |  |  |
|   |  |  |
| TWO TABS at top of card: "Log In"  |  "Sign Up" |  |  |
|   |  |  |
| LOG IN STATE: |  |  |
|   Email field (text input, email type) |  |  |
|   Password field (password input with show/hide toggle) |  |  |
|   "Forgot password?" text/xs teal link right-aligned below password |  |  |
|   "Log In" Primary Large button full width |  |  |
|   Divider with center label "or" |  |  |
|   "Continue with Google"  Secondary button full width (Google logo icon left) |  |  |
|   "Continue with Apple"   Secondary button full width (Apple logo icon left) |  |  |
|   |  |  |
| SIGN UP STATE (same as Log In plus): |  |  |
|   Confirm Password field |  |  |
|   After clicking Sign Up → transitions to Step 1 of Onboarding Wizard |  |  |
|   |  |  |
| FOOTER: text/xs neutral/400 centered: |  |  |
|   "We never sell your data. Your profile stays private." |  |  |
|   |  |  |
| Use brand/navy, brand/teal palette. Border-radius lg on card. Shadow/md. |  |  |

| S10 | Identity & Status Selection Screen | NEW |
| ----- | :---- | :---: |
| Design a full-screen onboarding step titled "What describes you?" |  |  |
| This step appears immediately after account creation. |  |  |
|   |  |  |
| HEADER: TrueCost logo top-left. Step progress bar showing Step 1 of 6\. |  |  |
| HEADLINE: "What describes you?" display/lg brand/navy centered |  |  |
| SUB-HEADLINE: "We'll use this to find discounts you actually qualify for." text/md neutral/600 |  |  |
|   |  |  |
| IDENTITY CARD GRID: 2 columns × 4 rows using Identity Selection Card components: |  |  |
|   Student               (graduation cap icon) |  |  |
|   Veteran / Active Military  (shield icon) |  |  |
|   Senior Citizen (65+)  (star icon) |  |  |
|   Healthcare Worker     (heart/cross icon) |  |  |
|   Teacher / Educator    (book icon) |  |  |
|   Government Employee   (building icon) |  |  |
|   None of the above     (person icon) |  |  |
|   |  |  |
| When a card is selected: teal-light bg, teal border, checkmark badge top-right. |  |  |
| Multiple cards can be selected simultaneously. |  |  |
|   |  |  |
| FOOTER NOTE: text/xs neutral/400 centered: |  |  |
|   "Selected statuses may require verification to unlock exclusive discounts." |  |  |
|   |  |  |
| ACTIONS: "Continue" Primary Large | "Skip for now" ghost link |  |  |
|   |  |  |
| Warm, inclusive tone — preference selector feel, not a bureaucratic form. |  |  |

| S11 | Status Verification Flow | NEW |
| ----- | :---- | :---: |
| Design a 3-step verification mini-flow modal — 420px wide. |  |  |
| Use Step Progress component (3 steps) at top. |  |  |
|   |  |  |
| STEP 1 — "Verify your student status": |  |  |
|   Show selected status name \+ icon (e.g. graduation cap) |  |  |
|   "This unlocks 23 additional discounts" text/sm teal |  |  |
|   Two verification option cards (full width): |  |  |
|     "Verify with .edu email"   envelope icon \+ description |  |  |
|     "Upload student ID"        upload icon \+ description |  |  |
|   "Continue" Primary button |  |  |
|   |  |  |
| STEP 2A — Email verification path: |  |  |
|   Email input with placeholder "you@university.edu" |  |  |
|   "Send Verification Code" Secondary button |  |  |
|   After sending: 6-digit code input \+ "Resend code" link |  |  |
|   "Verify" Primary button |  |  |
|   |  |  |
| STEP 2B — ID upload path: |  |  |
|   File Upload Dropzone component (full width) |  |  |
|   Accepted formats: JPG, PNG, PDF — max 5MB |  |  |
|   "Submit for Review" Primary button |  |  |
|   |  |  |
| STEP 3 — Confirmed: |  |  |
|   brand/teal checkmark icon 64px centered |  |  |
|   "Student Status Verified" display/sm |  |  |
|   List of newly unlocked discounts (3–4 examples as bullet chips) |  |  |
|   "Continue to dashboard" Primary Large button |  |  |
|   |  |  |
| PENDING REVIEW VARIANT (for Military/Government — manual review needed): |  |  |
|   Amber clock icon instead of checkmark |  |  |
|   "Under Review — usually 2–3 business days" headline |  |  |
|   "We'll email you when it's approved" subtext |  |  |
|   |  |  |
| Soft, reassuring visuals — secure and easy, not bureaucratic. |  |  |

| S7 | Onboarding Flow — 6-Step Wizard | REVISED |
| ----- | :---- | :---: |
| Design a 6-step onboarding modal wizard — 480px wide. |  |  |
| Step progress bar at top (use Step Progress component, all 6 steps). |  |  |
|   |  |  |
| STEP 1 — "What describes you?" |  |  |
|   Identity Selection Card grid (2 columns × 4 rows) |  |  |
|   Cards: Student | Veteran/Military | Senior Citizen | Healthcare Worker |  |  |
|          Teacher/Educator | Government Employee | None of the above |  |  |
|   Note: "Selected statuses may require verification" |  |  |
|   CTAs: "Continue" Primary | "Skip for now" ghost link |  |  |
|   |  |  |
| STEP 2 — "Verify your status" (conditional, shown if step 1 selection requires it) |  |  |
|   Show selected status \+ what it unlocks |  |  |
|   Two options: "Verify with .edu email" or "Upload ID" |  |  |
|   File Upload Dropzone component or email field (depends on selection) |  |  |
|   |  |  |
| STEP 3 — "Your memberships" |  |  |
|   Checklist of logos with Toggle Switch: Amazon Prime | Walmart+ | Costco |  |  |
|   Costco Gold Star | Netflix | Sam's Club |  |  |
|   |  |  |
| STEP 4 — "Your payment cards" |  |  |
|   Card type dropdown \+ "Does this card offer cashback?" toggle |  |  |
|   Privacy reassurance note text/xs neutral/400 |  |  |
|   |  |  |
| STEP 5 — "Location & preferences" |  |  |
|   State/ZIP input (for tax calculation) |  |  |
|   Notification opt-in toggle: "Alert me when memberships are due" |  |  |
|   |  |  |
| STEP 6 — "You're all set\!" |  |  |
|   Confirmation checkmark (brand/teal, 64px) |  |  |
|   Personalized summary of what was added |  |  |
|   "Start Saving" Primary Large button |  |  |
|   |  |  |
| Use Step Progress component to show current position. Navy/teal palette throughout. |  |  |

## **Component sheet**

| S8 | TEC Score Badge — Component Sheet | ORIGINAL |
| ----- | :---- | :---: |
| Design a Component Sheet showing all TEC Score Badge states. |  |  |
|   |  |  |
| LAYOUT: grid, badge size as columns, score variant as rows. |  |  |
|   |  |  |
| SIZES (columns): Large 56px | Medium 36px | Small 24px |  |  |
| SCORE VARIANTS (rows): |  |  |
|   Excellent  score 92  tec/excellent dark green |  |  |
|   Good       score 74  tec/good light green |  |  |
|   Fair       score 58  tec/fair amber |  |  |
|   Poor       score 41  tec/poor orange |  |  |
|   Bad        score 22  tec/bad red |  |  |
|   |  |  |
| Show label text below each badge in each cell. |  |  |
| Show hover state (subtle scale 1.05 \+ shadow/sm) and focus state (teal outline ring). |  |  |
|   |  |  |
| STRUCTURE: |  |  |
|   Circular SVG progress ring, clockwise fill from top, proportional to score |  |  |
|   Score number centered in DM Mono bold |  |  |
|   Thin neutral/100 background ring |  |  |
|   |  |  |
| Build as Figma component with Size × Score variant matrix. |  |  |

## **Figma file structure**

Create your Figma file with these 10 pages in this exact order:

| Page 1 | 🎨 Tokens | Colors, typography, spacing, shadows |
| :---- | :---- | :---- |
| **Page 2** | **🔘 Base Components** | Buttons, inputs, chips, avatars |
| **Page 3** | **💬 Feedback & Overlays** | Toasts, modals, tooltips, skeletons |
| **Page 4** | **📊 Data Display** | TEC badge, charts, tables, stat cards |
| **Page 5** | **🧭 Navigation** | Sidebar, topbar, tabs, breadcrumbs |
| **Page 6** | **🔌 Extension Components** | Overlay-specific components |
| **Page 7** | **📝 Form Components** | Onboarding, verification forms |
| **Page 8** | **🖥️ Screens — Desktop** | 1440px frames |
| **Page 9** | **📱 Screens — Mobile** | 390px frames |
| **Page 10** | **🔄 Flows & Prototypes** | User flows and prototype connections |

