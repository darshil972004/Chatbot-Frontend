import React, { useState, useEffect } from "react";
// Note: This is a single-file example Admin Panel using Tailwind + shadcn-style components.
// In a real project split components into files. This default-export component can be previewed.

// If using shadcn/ui, you might import components like:
// import { Button } from '@/components/ui/button'
// For this demo we use simple semantic HTML + Tailwind classes to keep it portable.

export default function AdminPanelApp() {
  const [route, setRoute] = useState("dashboard");
  const [agents, setAgents] = useState(mockAgents());
  const [sessions, setSessions] = useState(mockSessions());
  const [templates, setTemplates] = useState(mockTemplates());
  const [routingRules, setRoutingRules] = useState(mockRoutingRules());

  useEffect(() => {
    // Placeholder for initial data load (fetch from API)
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-3">
            <Sidebar route={route} setRoute={setRoute} agents={agents} sessions={sessions} />
          </aside>

          <main className="col-span-9">
            <Header />

            <div className="mt-4">
              {route === "dashboard" && <Dashboard agents={agents} sessions={sessions} />}
              {route === "agents" && (
                <AgentsPage agents={agents} setAgents={setAgents} />
              )}
              {route === "live" && (
                <LiveChatsPage sessions={sessions} setSessions={setSessions} agents={agents} setAgents={setAgents} />
              )}
              {route === "routing" && (
                <RoutingPage rules={routingRules} setRules={setRoutingRules} agents={agents} />
              )}
              {route === "templates" && (
                <TemplatesPage templates={templates} setTemplates={setTemplates} />
              )}
              {route === "history" && <ChatHistoryPage sessions={sessions} />}
              {route === "analytics" && <AnalyticsPage sessions={sessions} agents={agents} />}
              {route === "settings" && <SettingsPage />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Support Admin Panel</h1>
        <p className="text-sm text-slate-500">Manage agents, routing, and live chats</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-600">Admin</div>
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white grid place-items-center">A</div>
      </div>
    </div>
  );
}

function Sidebar({ route, setRoute, agents, sessions }) {
  const waitingCount = sessions.filter((s) => s.status === "waiting").length;
  const onlineCount = agents.filter((a) => a.status === "online").length;

  const item = (id, label, subtitle) => (
    <li
      key={id}
      onClick={() => setRoute(id)}
      className={`p-3 rounded cursor-pointer hover:bg-slate-100 flex justify-between items-center ${route === id ? "bg-white shadow" : ""}`}
    >
      <div>
        <div className="font-medium">{label}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
    </li>
  );

  return (
    <div className="sticky top-4">
      <div className="bg-white p-4 rounded shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="text-sm text-slate-500">Realtime control center</div>
        </div>

        <ul className="space-y-2">
          {item("dashboard", "Dashboard", null)}
          {item("agents", `Agents (${onlineCount} online)`, null)}
          {item("live", "Live Chats", `Waiting: ${waitingCount}`)}
          {item("routing", "Routing Rules", null)}
          {item("templates", "Message Templates", null)}
          {item("history", "Chat History", null)}
          {item("analytics", "Analytics", null)}
          {item("settings", "Settings", null)}
        </ul>
      </div>

      <div className="mt-4 bg-white p-4 rounded shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="flex flex-col gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Add Agent</button>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded">View Waiting</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ agents, sessions }) {
  const totalChats = sessions.length;
  const avgWait = Math.round((sessions.reduce((s, it) => s + (it.waitTime || 0), 0) / Math.max(1, sessions.length)) * 10) / 10;

  const topicCounts = sessions.reduce((acc, s) => {
    acc[s.topic] = (acc[s.topic] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Chats" value={totalChats} />
        <StatCard title="Active Agents" value={agents.filter((a) => a.status !== "offline").length} />
        <StatCard title="Avg Wait (s)" value={avgWait || 0} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-4 rounded shadow-sm">
          <h3 className="font-semibold mb-2">Topics distribution</h3>
          <div className="flex gap-4">
            <div className="w-72">
              {Object.entries(topicCounts).length === 0 && <div className="text-sm text-slate-500">No data</div>}
              {Object.entries(topicCounts).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1">
                  <div>{k}</div>
                  <div className="font-semibold">{v as number}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 text-sm text-slate-500">Use analytics to dig deeper into topics and agent performance.</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <h3 className="font-semibold mb-2">Top Agents</h3>
          <ul className="space-y-2">
            {agents.slice(0, 5).map((a) => (
              <li key={a.id} className="flex justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.role}</div>
                </div>
                <div className="text-sm">{a.metrics.chatsToday}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function AgentsPage({ agents, setAgents }) {
  function toggleStatus(id) {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: a.status === "online" ? "offline" : "online" } : a)));
  }

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Agents</h2>
        <button className="px-3 py-2 bg-blue-600 text-white rounded">Create Agent</button>
      </div>

      <table className="w-full text-left table-auto">
        <thead>
          <tr className="text-sm text-slate-500">
            <th className="p-2">Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
            <th className="p-2">Chats Today</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-2">{a.name}</td>
              <td className="p-2 text-sm text-slate-600">{a.role}</td>
              <td className="p-2">{a.status}</td>
              <td className="p-2">{a.metrics.chatsToday}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(a.id)} className="px-2 py-1 border rounded text-sm">Toggle</button>
                  <button className="px-2 py-1 border rounded text-sm">Edit</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveChatsPage({ sessions, setSessions, agents, setAgents }) {
  const [selected, setSelected] = useState(null);

  function takeSession(sessionId, agentId) {
    // assign session to agent locally
    setSessions((s) => s.map((x) => (x.id === sessionId ? { ...x, status: "assigned", assignedAgentId: agentId } : x)));
    setAgents((a) => a.map((ag) => (ag.id === agentId ? { ...ag, status: "busy", currentSessionId: sessionId } : ag)));
  }

  function endSession(sessionId) {
    setSessions((s) => s.map((x) => (x.id === sessionId ? { ...x, status: "closed" } : x)));
    setSelected(null);
  }

  const waiting = sessions.filter((s) => s.status === "waiting");
  const active = sessions.filter((s) => s.status === "assigned");

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 bg-white p-3 rounded shadow-sm">
        <h3 className="font-semibold mb-2">Waiting</h3>
        {waiting.length === 0 && <div className="text-sm text-slate-500">No waiting users</div>}
        <ul className="space-y-2">
          {waiting.map((w) => (
            <li key={w.id} className="p-2 border rounded cursor-pointer" onClick={() => setSelected(w.id)}>
              <div className="text-sm font-medium">Session {w.id}</div>
              <div className="text-xs text-slate-500">{w.topic}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-4 bg-white p-3 rounded shadow-sm">
        <h3 className="font-semibold mb-2">Active Sessions</h3>
        {active.length === 0 && <div className="text-sm text-slate-500">No active sessions</div>}
        <ul className="space-y-2">
          {active.map((a) => (
            <li key={a.id} className="p-2 border rounded cursor-pointer" onClick={() => setSelected(a.id)}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Session {a.id}</div>
                  <div className="text-xs text-slate-500">Agent {a.assignedAgentId}</div>
                </div>
                <div className="text-sm">{a.duration}s</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-5 bg-white p-3 rounded shadow-sm">
        <h3 className="font-semibold mb-2">Chat Window</h3>
        {!selected && <div className="text-sm text-slate-500">Select a session to view chat</div>}
        {selected && (
          <div>
            <ChatWindow session={sessions.find((s) => s.id === selected)} onEnd={() => endSession(selected)} agents={agents} onAssign={takeSession} />
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWindow({ session, onEnd, agents, onAssign }) {
  if (!session) return null;
  const availableAgents = agents.filter((a) => a.status === "online");

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <div>
          <div className="font-medium">Session {session.id}</div>
          <div className="text-xs text-slate-500">Topic: {session.topic}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEnd} className="px-2 py-1 bg-red-500 text-white rounded">End</button>
        </div>
      </div>

      <div className="border rounded p-3 h-64 overflow-auto mb-3 bg-slate-50">
        {session.messages.map((m, i) => (
          <div key={i} className={`p-2 my-1 rounded ${m.sender === "agent" ? "bg-white" : "bg-blue-50"}`}>
            <div className="text-xs text-slate-500">{m.sender}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <select className="p-2 border rounded" defaultValue="" onChange={(e) => onAssign(session.id, Number(e.target.value))}>
          <option value="">Assign to agent...</option>
          {availableAgents.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
          ))}
        </select>
        <input className="flex-1 p-2 border rounded" placeholder="Type a message to user (not implemented)" />
        <button className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}

function RoutingPage({ rules, setRules, agents }) {
  const [editing, setEditing] = useState<number | null>(null);

  function addRule() {
    const newRule = { id: Date.now(), topic: "new topic", allowedRoles: ["technical"], priority: 5, autoAssign: true };
    setRules((r) => [newRule, ...r]);
    setEditing(newRule.id);
  }

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Routing Rules</h2>
        <button onClick={addRule} className="px-3 py-2 bg-emerald-600 text-white rounded">Add Rule</button>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="border p-3 rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{r.topic}</div>
                <div className="text-xs text-slate-500">Roles: {r.allowedRoles.join(", ")}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 border rounded" onClick={() => setEditing(r.id)}>Edit</button>
                <button className="px-2 py-1 border rounded" onClick={() => setRules((prev) => prev.filter((x) => x.id !== r.id))}>Delete</button>
              </div>
            </div>

            {editing === r.id && (
              <div className="mt-2">
                <label className="text-sm text-slate-600">Priority</label>
                <input type="number" defaultValue={r.priority} className="w-24 p-2 border rounded mt-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesPage({ templates, setTemplates }) {
  function updateTemplate(id, content) {
    setTemplates((t) => t.map((x) => (x.id === id ? { ...x, content } : x)));
  }

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Message Templates</h2>
      <div className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="border p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-medium">{tpl.type}</div>
                <div className="text-xs text-slate-500">Preview</div>
              </div>
            </div>
            <textarea defaultValue={tpl.content} onBlur={(e) => updateTemplate(tpl.id, e.target.value)} className="w-full p-2 border rounded" rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatHistoryPage({ sessions }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Chat History</h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border p-2 rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">Session {s.id}</div>
                <div className="text-xs text-slate-500">Topic: {s.topic}</div>
              </div>
              <div className="text-sm">Messages: {s.messages.length}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage({ sessions, agents }) {
  const total = sessions.length;
  const closed = sessions.filter((s) => s.status === "closed").length;
  const avgDuration = Math.round((sessions.reduce((s, it) => s + (it.duration || 0), 0) / Math.max(1, sessions.length)) * 10) / 10;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Sessions" value={total} />
        <StatCard title="Closed" value={closed} />
        <StatCard title="Avg Duration (s)" value={avgDuration} />
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <h3 className="font-semibold mb-2">Agent Response Times (sample)</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          {agents.map((a) => (
            <li key={a.id} className="flex justify-between">
              <div>{a.name}</div>
              <div>{a.metrics.avgResponse}s</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-600">Business Hours</label>
          <input className="p-2 border rounded w-64 mt-1" defaultValue="Mon-Fri 9:00-18:00" />
        </div>
        <div>
          <label className="block text-sm text-slate-600">Fallback Option</label>
          <select className="p-2 border rounded mt-1">
            <option>Continue with bot</option>
            <option>Request callback</option>
            <option>Send email</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ChatWindowMini({ session }) {
  return (
    <div className="border p-2 rounded bg-white">
      {session.messages.map((m, i) => (
        <div key={i} className="text-sm py-1">
          <div className="text-xs text-slate-400">{m.sender}</div>
          <div>{m.text}</div>
        </div>
      ))}
    </div>
  );
}

// ------------------------ Mock Data ------------------------
function mockAgents() {
  return [
    { id: 1, name: "Rakesh", role: "technical", status: "online", currentSessionId: null, metrics: { chatsToday: 12, avgResponse: 5 } },
    { id: 2, name: "Maya", role: "sales", status: "online", currentSessionId: 101, metrics: { chatsToday: 8, avgResponse: 7 } },
    { id: 3, name: "Arjun", role: "support", status: "offline", currentSessionId: null, metrics: { chatsToday: 4, avgResponse: 12 } },
  ];
}

function mockSessions() {
  return [
    { id: 101, userId: "u101", topic: "booking", status: "assigned", assignedAgentId: 2, messages: [{ sender: "user", text: "Hi, I need help booking" }, { sender: "agent", text: "Sure — I can help" }], duration: 120, waitTime: 5 },
    { id: 102, userId: "u102", topic: "technical", status: "waiting", assignedAgentId: null, messages: [{ sender: "user", text: "App crashes when I upload" }], duration: 0, waitTime: 20 },
    { id: 103, userId: "u103", topic: "pricing", status: "closed", assignedAgentId: null, messages: [{ sender: "user", text: "What are your fees?" }, { sender: "bot", text: "Here is our pricing" }], duration: 60, waitTime: 2 },
  ];
}

function mockTemplates() {
  return [
    { id: 1, type: "greeting", content: "Welcome! How can I help today?" },
    { id: 2, type: "waiting", content: "All agents are busy. We'll connect you shortly." },
    { id: 3, type: "fallback", content: "Your agent is unavailable. Please try again later or leave a message." },
  ];
}

function mockRoutingRules() {
  return [
    { id: 1, topic: "technical", allowedRoles: ["technical"], priority: 1, autoAssign: true },
    { id: 2, topic: "sales", allowedRoles: ["sales"], priority: 5, autoAssign: true },
  ];
}

// ------------------------ End ------------------------
