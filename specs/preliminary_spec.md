This is the optimized, production-ready Product Requirements Document (PRD) and Technical Specification for the **"Smart XDebug MCP Server."**

This document refines the architecture into a robust "Agentic Runtime Environment," specifically engineered to handle the high-context cost and non-linear nature of AI debugging.

### 1. Executive Summary

**Product Name:** XDebug-MCP "Surgical" Bridge
**Goal:** Enable Large Language Models (Claude Code, Opus) to autonomously debug PHP applications by bridging the DBGp protocol with the Model Context Protocol (MCP).
**Core Philosophy:** "Pull, Don't Push." The system prevents context pollution by requiring the Agent to request specific data slices (GraphQA-style) rather than dumping full state.

### 2. System Architecture

The system consists of three distinct layers: The **Orchestrator** (Process Manager), the **Translator** (Protocol Bridge), and the **Recorder** (State Cache).

### 3. Product Requirements Document (PRD)

#### 3.1. Core Features (Functional)

**A. "Zero-Config" Environment Awareness**

* **REQ-1 (Path Mapping):** The system MUST automatically ingest path mappings from `.vscode/launch.json` or a standard `docker-compose.yml` to translate paths between the Host (LLM view) and Container (XDebug view).
* **REQ-2 (Port Management):** The system MUST dynamically handle port conflicts. If 9003 is busy, it should attempt to bind 9004-9010 and update the `XDEBUG_CONFIG` environment variable for the trigger command accordingly.

**B. The "Trap & Trigger" Workflow**

* **REQ-3 (Orchestration):** The `start_session` tool MUST accept a trigger command (e.g., `curl`, `php artisan test`) and a "Strategy Preset."
* *Strategies:* `standard` (Break on breakpoints), `panic` (Break on Exception/Error), `profile` (Break on Entry).


* **REQ-4 (Non-Blocking Triggers):** The trigger command MUST run in a detached child process so the MCP server remains responsive to XDebug signals.

**C. Surgical Data Inspection (The Context Guardrail)**

* **REQ-5 (Filtered Retrieval):** The `inspect_variable` tool MUST support a `filter` parameter using **JSONPath** syntax (e.g., `$.items[*].price`).
* **REQ-6 (Safety Limits):** All variable retrieval MUST default to a `depth=1` and `max_children=20`. The Agent must explicitly request deeper access.

**D. Session Recorder (Time Travel)**

* **REQ-7 (The Black Box):** The system MUST maintain a localized SQLite or JSON-based ledger of every variable inspected during a session.
* **REQ-8 (History Query):** The Agent MUST be able to query this ledger (e.g., "What was `$status` 3 steps ago?") without stepping the live debugger back (which is impossible in PHP).

#### 3.2. Non-Functional Requirements

* **REQ-9 (Watchdog Timer):** If the LLM does not issue a command for 60 seconds while paused, the system MUST auto-terminate the debug session to prevent "Zombie Processes" in the Docker container.
* **REQ-10 (Structured Logs):** Upon session termination, the system MUST generate a Markdown Artifact (`session_summary.md`) detailing the execution path, exceptions caught, and variables modified.

---

### 4. Technical Specifications (Tool Definitions)

These schema definitions are optimized for **Claude Code** and **Opus 4.5**. They use specific keywords ("Surgical," "Query," "Snapshot") to guide the model's behavior.

#### Tool 1: `start_debug_session`

*Description:* Initializes the debugger and executes the trigger command.

```json
{
  "name": "start_debug_session",
  "description": "Starts a new debugging session. You must set breakpoints via `set_breakpoint` BEFORE calling this.",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The command to trigger the code (e.g., 'curl http://localhost/api/checkout' or 'php artisan test --filter=UserTest')."
      },
      "stop_on_entry": {
        "type": "boolean",
        "description": "If true, pauses at the very first line of execution. Use for scripts with unknown flow."
      },
      "stop_on_exception": {
        "type": "boolean",
        "description": "If true, pauses automatically when an Error or Exception is thrown."
      }
    },
    "required": ["command"]
  }
}

```

#### Tool 2: `set_breakpoint`

*Description:* Sets a breakpoint. Handles path translation automatically.

```json
{
  "name": "set_breakpoint",
  "description": "Sets a breakpoint at a specific file and line.",
  "input_schema": {
    "type": "object",
    "properties": {
      "file": {
        "type": "string",
        "description": "The local file path (relative to project root). The system will map this to the remote server path."
      },
      "line": { "type": "integer" },
      "condition": {
        "type": "string",
        "description": "Optional PHP expression. Break only if true (e.g. '$user->id == 5'). HIGHLY RECOMMENDED for loops."
      }
    },
    "required": ["file", "line"]
  }
}

```

#### Tool 3: `inspect_variable` (The Core "Surgical" Tool)

*Description:* Reads variable state. Forces filtering to save context.

```json
{
  "name": "inspect_variable",
  "description": "Surgically inspects a variable. Returns JSON.",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "The PHP variable name (e.g., '$this', '$context', '$_SERVER')."
      },
      "filter": {
        "type": "string",
        "description": "A JSONPath query to filter results (e.g., '$.user.emails[0]'). If omitted, returns a shallow structure summary (keys only)."
      },
      "depth": {
        "type": "integer",
        "default": 1,
        "description": "Recursion depth. Default is 1. Max is 3."
      }
    },
    "required": ["name"]
  }
}

```

#### Tool 4: `control_execution`

*Description:* Stepping controls.

```json
{
  "name": "control_execution",
  "description": "Controls the debugger flow.",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["step_over", "step_into", "step_out", "continue", "stop"]
      }
    },
    "required": ["action"]
  }
}

```

---

### 5. The "System Prompt" (Context & Instructions)

This is the exact prompt instructions you should load into Claude Code or your Agent's System Prompt to utilize these tools effectively.

> **## XDebug Agent Protocol**
> You have access to a live XDebug environment via MCP. Your goal is to debug runtime issues efficiently.
> **1. THE COST OF CONTEXT**
> Reading variables is expensive. NEVER dump full objects.
> * **Bad:** `inspect_variable('$order')` (Returns 5000 lines of JSON).
> * **Good:** `inspect_variable('$order', '$.items[*].sku')` (Returns 5 lines).
> 
> 
> **2. THE WORKFLOW**
> 1. **Hypothesize:** Analyze the code text first. Guess where the bug is.
> 2. **Trap:** Set breakpoints (`set_breakpoint`) at critical decision points.
> 3. **Trigger:** Start the session (`start_debug_session`).
> 4. **Surgical Strike:** When paused, inspect *only* the specific fields relevant to your hypothesis using JSONPath filters.
> 5. **Reflect:** If the data contradicts your hypothesis, refine and `continue`.
> 
> 
> **3. PATH MAPPING**
> Always use **Local Relative Paths** (e.g., `src/Controller/UserController.php`). The system handles Docker mapping for you.
> **4. EXCEPTIONS**
> If you don't know where the crash is, use `start_debug_session` with `stop_on_exception: true`.

---

### 6. Implementation Guide (Node.js)

#### Core Logic: The "Packet Processor"

This is the hardest part to implement. You need a parser for the DBGp XML protocol.

```javascript
// Pseudo-code for the "Translator" Logic

class DebugSession {
  // ... connection setup ...

  /**
   * Handles the 'break' response from XDebug
   * @param {XMLDocument} xml - The raw DBGp response
   */
  async handleBreak(xml) {
    const remoteFile = xml.getAttribute('filename');
    const line = parseInt(xml.getAttribute('lineno'));
    
    // 1. Path Translation (Docker -> Local)
    const localFile = this.pathMapper.toLocal(remoteFile);
    
    // 2. Context Preview (Read local file)
    const codeSnippet = await this.fileSystem.readLines(localFile, line - 2, line + 2);

    // 3. Notify MCP Client (Claude)
    return {
      status: "paused",
      location: { file: localFile, line: line },
      snippet: codeSnippet,
      reason: "breakpoint_hit"
    };
  }

  /**
   * Handles the 'inspect' request
   */
  async inspectVariable(name, filterPath) {
    // 1. Get raw property from XDebug (Low depth to save memory)
    const rawXml = await this.sendCommand(`property_get -n "${name}" -d 2`);
    
    // 2. Convert XML to JSON Object
    const jsonObject = this.xmlToJson(rawXml);
    
    // 3. Apply JSONPath Filtering (The GraphQA Layer)
    if (filterPath) {
      try {
        return jsonpath.query(jsonObject, filterPath);
      } catch (e) {
        return { error: "Invalid JSONPath", available_keys: Object.keys(jsonObject) };
      }
    }
    
    // 4. Fallback: Return Structure Only
    return this.summarizeStructure(jsonObject);
  }
}

```

### 7. Strategic "Next Steps" for You

1. **Environment Check:** Do you have `xdebug` installed in your Docker container?
2. **Scaffolding:** Would you like me to generate the `index.ts` (Entry point) for the MCP server using the official `@modelcontextprotocol/sdk`? This will give you the skeleton to start coding the handlers immediately.