const express = require('express');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 8080;

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

const helloWorldCounter = new promClient.Counter({
    name: 'root_access_total',
    help: 'Total number of accesses to the root path',
});
register.registerMetric(helloWorldCounter);



// Define routes
app.get('/my-app', (req, res) => {
    helloWorldCounter.inc();

    const hostname = process.env.HOSTNAME || "unknown";
    const uptime = process.uptime();

    const asciiBanner = `
╔══════════════════════════════════════╗
║   🚀 AMAREL CHALLENGE MICRO-SERVICE  ║
╚══════════════════════════════════════╝
    `.trim();

    const messages = [
        "Deploy. Scale. Conquer. Kubernetes style. ⚔️",
        "ArgoCD is watching your every commit 👁️",
        "Zero downtime? Challenge accepted 🧠",
        "Pods come and go, but logs are forever 📜",
        "CI/CD is not a pipeline. It’s a lifestyle 💡"
    ];

    const colors = {
        green: "\x1b[32m",
        cyan: "\x1b[36m",
        yellow: "\x1b[33m",
        reset: "\x1b[0m"
    };

    const response = {
        banner: asciiBanner,
        status: `${colors.green}ONLINE${colors.reset}`,
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(2, 10),
        
        system: {
            hostname,
            uptime_seconds: Math.round(uptime),
            cpu_usage: `${(Math.random() * 20 + 10).toFixed(2)}%`,
            memory_usage_mb: (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
        },

        kubernetes: {
            pod: hostname,
            namespace: process.env.POD_NAMESPACE || "unknown",
            node: process.env.K8S_NODE_NAME || "unknown"
        },

        client: {
            ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        },

        funMessage: messages[Math.floor(Math.random() * messages.length)]
    };

    res.status(200).json(response);
});

app.get('/about', (req, res) => {
    res.send('This is a sample Node.js application for Kubernetes deployment testing.');
});

app.get('/ready', (req, res) => {
    res.status(200).send('Ready');
});

app.get('/live', (req, res) => {
    res.status(200).send('Alive');
});

app.get('/classified', (req, res) => {
    res.status(200).send('You should not be here!!!');
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
