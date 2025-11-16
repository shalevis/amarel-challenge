const express = require('express');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 8080;

// Prometheus registry
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Counter example metric
const helloWorldCounter = new promClient.Counter({
    name: 'root_access_total',
    help: 'Total number of accesses to the /my-app path',
});
register.registerMetric(helloWorldCounter);

// MAIN UI ENDPOINT
app.get('/my-app', (req, res) => {
    helloWorldCounter.inc();

    const hostname = process.env.HOSTNAME || "unknown";
    const namespace = process.env.POD_NAMESPACE || "amarel-challenge";
    const node = process.env.K8S_NODE_NAME || "unknown";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Amarel Challenge | Microservice Dashboard</title>
        <style>
            body {
                background: #0d1117;
                color: #e6edf3;
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 900px;
                margin: 50px auto;
                padding: 20px;
                background: #161b22;
                border-radius: 12px;
                box-shadow: 0px 0px 20px #00000066;
            }
            h1 {
                color: #58a6ff;
                text-align: center;
            }
            .section {
                margin: 30px 0;
                padding: 20px;
                background: #1f2630;
                border-radius: 10px;
            }
            .label {
                color: #8b949e;
            }
            .value {
                color: #c9d1d9;
                font-weight: bold;
            }
            .badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 8px;
                background: #238636;
                color: white;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                color: #565f67;
            }
            a { color: #58a6ff; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Amarel Challenge Micro-Service</h1>
            <p style="text-align:center">
                <span class="badge">ONLINE</span>
            </p>

            <div class="section">
                <h2>📌 Kubernetes Info</h2>
                <p><span class="label">Pod:</span> <span class="value">${hostname}</span></p>
                <p><span class="label">Namespace:</span> <span class="value">${namespace}</span></p>
                <p><span class="label">Node:</span> <span class="value">${node}</span></p>
            </div>

            <div class="section">
                <h2>📡 API Endpoints</h2>
                <p><a href="/my-app">/my-app</a> — UI Dashboard</p>
                <p><a href="/ready">/ready</a> — Readiness Probe</p>
                <p><a href="/live">/live</a> — Liveness Probe</p>
                <p><a href="/metrics">/metrics</a> — Prometheus Metrics</p>
            </div>

            <div class="footer">
                Built with ❤️ for the Amarel Challenge
            </div>

        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// BASIC ROUTES
app.get('/about', (req, res) => {
    res.send('This is a sample Node.js application for Kubernetes deployment testing.');
});

app.get('/ready', (req, res) => res.status(200).send('Ready'));
app.get('/live', (req, res) => res.status(200).send('Alive'));

// PROMETHEUS METRICS
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// START SERVER
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
