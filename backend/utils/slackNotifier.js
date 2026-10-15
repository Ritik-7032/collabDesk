/**
 * Slack Notification Utility
 * Sends rich formatted Slack messages to workspace-specific incoming webhooks.
 * Runs asynchronously and fails silently to prevent blocking main database operations.
 */

async function postToSlack(webhookUrl, payload) {
  if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Slack webhook rejected:", res.status, errText);
    }
  } catch (err) {
    console.warn("Slack notification failed:", err.message);
  }
}

/**
 * Send a notification when a task is created or moved
 */
function notifyTaskEvent({ workspace, eventType, task, listName, actorName, assigneeName }) {
  if (!workspace?.slackWebhookUrl) return;

  let color = "#f2a93b"; // Amber default
  let headerText = "Task Updated";

  if (eventType === "task_created") {
    headerText = "🎯 *New Task Created*";
    color = "#5b8def"; // Blue
  } else if (eventType === "task_moved") {
    if (listName && listName.toLowerCase().includes("done")) {
      headerText = "🎉 *Task Completed*";
      color = "#38c793"; // Green
    } else {
      headerText = `🚀 *Task Moved to "${listName || "New Column"}"*`;
      color = "#f2a93b";
    }
  } else if (eventType === "comment_added") {
    headerText = "💬 *New Comment on Task*";
    color = "#45c4b0"; // Teal
  }

  const fields = [
    { title: "Workspace", value: workspace.name || "CollabDesk", short: true },
    { title: "Action by", value: actorName || "Team Member", short: true },
  ];

  if (assigneeName) {
    fields.push({ title: "Assigned To", value: assigneeName, short: true });
  }
  if (listName && eventType !== "task_moved") {
    fields.push({ title: "Column", value: listName, short: true });
  }

  const payload = {
    attachments: [
      {
        color,
        pretext: headerText,
        title: task.title,
        text: task.description ? (task.description.length > 200 ? task.description.slice(0, 197) + "..." : task.description) : undefined,
        fields,
        footer: "CollabDesk Real-Time Sync",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  // Fire and forget
  setImmediate(() => {
    postToSlack(workspace.slackWebhookUrl, payload);
  });
}

/**
 * Send a test notification to verify webhook connection
 */
async function sendSlackTest(webhookUrl, workspaceName, userName) {
  const payload = {
    attachments: [
      {
        color: "#38c793",
        pretext: "⚡ *CollabDesk Connected!*",
        title: `Slack alerts are now live for ${workspaceName || "your workspace"}`,
        text: `Connected by *${userName || "Admin"}*. You will receive notifications here whenever tasks are created, moved, or completed.`,
        footer: "CollabDesk Slack Integration",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack responded with status ${res.status}`);
  }
  return true;
}

module.exports = {
  notifyTaskEvent,
  sendSlackTest,
};
