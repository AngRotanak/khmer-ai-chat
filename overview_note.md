✅ 1. Block Organization in Firebase
We group blocks by type for clarity and cheap reads:

json
feature_blocks_by_type: {
  info: { info_skin_care: { ... }, info_contact: { ... } },
  welcome: { welcome_main: { ... } },
  menu: { menu_main: { ... } },
  product: { product_soap: { ... } },
  carousel: { carousel_products: { ... } },
  intent: { intent_price: { ... } }
},
feature_block_index: {
  info_skin_care: "info",
  welcome_main: "welcome",
  menu_main: "menu",
  product_soap: "product",
  carousel_products: "carousel",
  intent_price: "intent"
}
✅ 2. Block Structure
Each block includes:

ts
type FeatureBlock = {
  block_id: string
  block_name: string
  block_type: string
  is_active: boolean
  tags: string[]
  linked_pages: string[]
  created_by: string
  last_updated: string
  version: number

  entry_trigger: 'message' | 'ref_url' | 'qr_code' | 'comment' | 'ad_click' | 'shop_message'
  entry_condition: {
    match: 'includes' | 'equals' | 'starts_with'
    value: string
  }

  templates: Record<string, Template>
  canvas: {
    layout: 'vertical' | 'horizontal'
    paths: PathItem[]
  }
}
✅ 3. Template Types
Each block can contain multiple templates:

ts
type TextTemplate = {
  template_id: string
  template_type: 'text'
  lang: 'en' | 'kh'
  is_active: boolean
  text: string
}

type GenericTemplate = {
  template_id: string
  template_type: 'generic'
  lang: 'en' | 'kh'
  is_active: boolean
  cards: Card[]
}

type Card = {
  title: string
  subtitle?: string
  image_url?: string
  options: {
    label_en?: string
    label_kh?: string
    payload: string
    type: 'postback' | 'web_url'
  }[]
}
✅ 4. Canvas Paths with Wait Triggers
Each path can be immediate or conditional:

ts
type PathItem = {
  template_id: string
  send_immediately: boolean
  trigger?: 'user_message' | 'postback' | 'intent'
  condition?: {
    match: 'includes' | 'equals' | 'starts_with'
    value: string
  }
  delay?: {
    seconds: number
    target?: string
  }
}
✅ 5. Trigger Logic Distinction
We separate:

Type	Field	Purpose
Start Trigger	entry_trigger + entry_condition	Starts the block
Wait Trigger	canvas.paths[n].trigger + condition	Waits for user input before continuing
✅ 6. Flow Patterns Supported
🔹 Pattern A: Immediate Flow
Block starts

All paths sent immediately

🔹 Pattern B: Conditional Flow
Block starts

First path sent

Second path waits for user input (e.g. “how much?”)

✅ 7. Realtime Database Benefits
Flat keys for cheap reads

Grouped by type for admin clarity

Indexed for fast lookup

Canvas is React-friendly

Templates are reusable and language-specific

Flow compiler can generate Messenger-safe flow_data


Yes, Ang — that’s a brilliant reference. Manychat’s trigger system is a great model for KhmerAi.Chat’s admin UX. It separates event-based triggers from message-based logic, and gives admins a clear, intuitive way to start automations. Let’s break it down and map it to your platform.

✅ What Manychat Does Well
🔹 Step 1: Choose a Messenger Event
Left panel shows where the trigger comes from:

Facebook Ad click

Comment on post

Message received

Ref URL clicked

QR code scanned

Facebook Shop message

🔹 Step 2: Choose How to Match
Right panel shows how to match the input:

Detect specific words

Recognize intent (AI-powered)

🧠 How to Apply This in KhmerAi.Chat
You can split your trigger logic into two layers:

✅ Layer 1: entry_trigger (Messenger event source)
ts
entry_trigger: 'message' | 'ref_url' | 'qr_code' | 'comment' | 'shop_message' | 'ad_click'
This replaces hardcoded assumptions. You can show a dropdown like:

“Start automation when…” ➤ User sends a message ➤ User clicks a referral link ➤ User scans a QR code

✅ Layer 2: canvas.trigger + canvas.condition
Once the block is activated, you match the input:

ts
canvas: {
  trigger: 'user_message' | 'postback' | 'intent',
  condition: {
    match: 'includes' | 'equals' | 'starts_with',
    value: 'ថ្លៃ'
  }
}
This lets admins choose:

“Detect specific words” → trigger: 'user_message', match: 'includes' “Recognize intent” → trigger: 'intent', match: 'equals'

✅ Suggested UI Flow
Trigger Panel (left): “Start automation when…”

[x] User sends a message

[ ] User clicks a referral link

[ ] User scans a QR code

Condition Panel (right): “Select a way to trigger automation”

[x] Detect specific words

[ ] Recognize intent (AI)

Input Field: Keyword or intent name

✅ Suggested Schema
ts
type BlockTrigger = {
  entry_trigger: 'message' | 'ref_url' | 'qr_code' | 'comment' | 'shop_message' | 'ad_click'
  canvas: {
    trigger: 'user_message' | 'postback' | 'intent'
    condition: {
      match: 'includes' | 'equals' | 'starts_with'
      value: string
    }
  }
}
I can help scaffold a TriggerEditorPanel component that shows both layers with Khmer-friendly labels, Messenger-safe validation, and preview logic. Want to wire that up next?

wait we have two thing to consider about trigger 1.start trigger 2.wait to trigger
Yes, Ang — that’s a crucial distinction. In KhmerAi.Chat’s flow logic, we need to separate two types of triggers:

✅ 1. Start Trigger (Entry Point)
This defines how the block is first activated — the external event that starts the automation.

🔹 Examples:
User sends a message

User clicks a referral link

User scans a QR code

User comments on a post

User clicks a Facebook Ad

🔹 Suggested Field:
ts
entry_trigger: 'message' | 'ref_url' | 'qr_code' | 'comment' | 'ad_click' | 'shop_message'
This is used by the flow engine to decide when to enter the block.

✅ 2. Wait Trigger (Internal Condition)
This defines how the block waits for user input before continuing — used inside the block after it starts.

🔹 Examples:
Wait for user to type a keyword

Wait for user to click a button

Wait for AI to detect intent

🔹 Suggested Fields:
ts
canvas: {
  trigger: 'user_message' | 'postback' | 'intent',
  condition: {
    match: 'includes' | 'equals' | 'starts_with',
    value: 'ថ្លៃ'
  }
}
This is used by the block logic to decide when to continue or route.

🧠 Visual Breakdown
Code
🟢 Entry Trigger (starts the block)
    └── entry_trigger: 'ref_url'

📦 Block runs → sends templates

⏳ Wait Trigger (inside block)
    └── trigger: 'user_message'
    └── condition: includes 'ថ្លៃ'
✅ Final Schema Suggestion
ts
type FeatureBlock = {
  block_id: string
  block_type: string
  entry_trigger: 'message' | 'ref_url' | 'qr_code' | ...
  templates: Record<string, Template>
  canvas: {
    layout: 'vertical' | 'horizontal'
    paths: string[]
    trigger?: 'user_message' | 'postback' | 'intent'
    condition?: {
      match: 'includes' | 'equals' | 'starts_with'
      value: string
    }
    delay?: {
      seconds: number
      target: string
    }
  }
}

🧠 Feature Block Path Configuration
Each path inside canvas.paths can include:

Field	Purpose
trigger	Defines when the path activates (immediate, on_reply, etc.)
send_immediately	If true, sends the template without waiting for user input
condition	Keyword-based matching logic (e.g., { match: "includes", value: "hi" })
detection_mode	"keyword" or "intent" — determines how the condition is evaluated
expected_intent	Used when detection_mode is "intent" — e.g., "greeting"
intent_confidence	Minimum confidence threshold for intent matching (e.g., 0.85)
template_ref	Points to the shared template to send
label	Optional label for admin clarity (e.g., "Path 1")


Yes, I remember, Ang. In our flow‑builder architecture, **`feature-block.welcome`** is the special block type that represents the **entry point of a conversation** — the very first message or sequence that greets a user when they open the Messenger chat.  

Here’s how it differs from `feature-block.info` and why it matters:

---

### 🔑 What `feature-block.welcome` is
- **Entry block / root node**: It’s the starting node of the bot flow. Every conversation begins here, so it anchors the graph.
- **Greeting logic**: Typically contains the welcome text, branding, or initial quick‑replies to guide the user.
- **Messenger‑safe export**: When exporting to Messenger, this block is mapped to the “Get Started” payload or the default welcome message that Facebook Messenger expects.
- **Special handling**: Unlike `info` or `carousel`, the welcome block isn’t triggered by another node — it’s triggered automatically when the user first interacts with the bot.

---

### ⚙️ Key differences vs. `feature-block.info`
- `info`: A reusable informational block, triggered by edges or options.
- `welcome`: A singleton block, always present, and must be exported as the bot’s entry point.  
- Export logic: `welcome` must be serialized into Messenger’s `get_started` or `persistent_menu` configuration, while `info` blocks are serialized as templates/messages.

---

### 🛠️ What to focus on now
Since you’ve finished `info` configuration and export, for `welcome` you’ll want to:
1. **Ensure only one welcome block exists** in a flow (singleton enforcement).
2. **Export mapping**: Map it to Messenger’s `get_started` payload.
3. **UI clarity**: In the builder, visually distinguish the welcome block (badge, icon, or locked position at the top).
4. **Validation**: During `validateAllChains`, enforce that the welcome block has no incoming edges (it’s the root).

---

So yes — `feature-block.welcome` is the **root greeting block** that defines how the bot introduces itself and starts the conversation.  

Do you want me to sketch out the **export JSON structure** for `feature-block.welcome` so you can align it with Messenger’s `get_started` requirements?