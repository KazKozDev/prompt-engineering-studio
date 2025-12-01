# Metrics: Monitor Production Performance

## Overview

**Production Metrics** provides real-time monitoring and analytics for your deployed prompts. Track performance, identify issues, and optimize based on actual usage data from production environments.

## Quick Start

### 1. View Dashboard

**Location:** Main panel → Production Metrics

**Dashboard sections:**
- **Overview** — High-level KPIs
- **Performance Charts** — Time-series graphs
- **Prompt Breakdown** — Per-prompt analytics
- **Alerts** — Issues requiring attention
- **Cost Analysis** — Token usage and expenses

### 2. Select Time Range

**Location:** Top right → Date picker

**Presets:**
- Last hour
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**Real-time mode:**
- Toggle "Live" for auto-refresh every 30s
- See metrics update in real-time

### 3. Filter by Prompt

**Location:** Top left → Prompt selector

- **All Prompts** — Aggregate view
- **Specific prompt** — Drill down into one
- **Compare** — Side-by-side comparison (up to 3)

### 4. Analyze Metrics

**Key metrics displayed:**
- Request volume
- Success rate
- Latency (p50, p95, p99)
- Error rate
- Token usage
- Cost per request

## Key Metrics Explained

### Request Volume

**What it measures:** Number of API calls to your prompts

**Metrics:**
- **Total requests** — Cumulative count
- **Requests per minute (RPM)** — Current rate
- **Peak RPM** — Highest rate in time range
- **Trend** — Increasing/decreasing/stable

**Chart:**
- Time-series line graph
- Hover for exact counts
- Zoom in on time ranges

**Use cases:**
- Capacity planning
- Identifying traffic patterns
- Detecting anomalies (sudden spikes/drops)

### Success Rate

**What it measures:** % of requests that completed successfully

**Formula:** `(Successful requests / Total requests) × 100`

**Thresholds:**
- **Healthy:** >95%
- **Warning:** 90-95%
- **Critical:** <90%

**Chart:**
- Percentage line graph
- Color-coded: Green (>95%), Yellow (90-95%), Red (<90%)

**Failure breakdown:**
- Timeout errors
- LLM errors (rate limits, model errors)
- Validation errors (invalid inputs)
- System errors (crashes, network issues)

### Latency

**What it measures:** Response time from request to completion

**Percentiles:**
- **p50 (median):** 50% of requests faster than this
- **p95:** 95% of requests faster than this
- **p99:** 99% of requests faster than this (worst-case)

**Why percentiles matter:**
- **Mean** can be skewed by outliers
- **p95/p99** show worst-case user experience

**Chart:**
- Multi-line graph (p50, p95, p99)
- Hover for exact milliseconds

**Targets:**
- **p50:** <1000ms
- **p95:** <2000ms
- **p99:** <5000ms

**Latency breakdown:**
- LLM processing time
- Network time
- Queue time (if applicable)

### Error Rate

**What it measures:** % of requests that failed

**Formula:** `(Failed requests / Total requests) × 100`

**Error categories:**
- **4xx errors:** Client errors (bad input, auth issues)
- **5xx errors:** Server errors (crashes, timeouts)
- **LLM errors:** Model-specific failures

**Chart:**
- Stacked area chart by error type
- Hover for error details

**Alert triggers:**
- Error rate >5% for 5 minutes
- Any critical errors (5xx)

### Token Usage

**What it measures:** Number of tokens processed

**Metrics:**
- **Input tokens** — Prompt tokens
- **Output tokens** — Generated response tokens
- **Total tokens** — Sum of input + output
- **Avg tokens per request** — Total / request count

**Chart:**
- Stacked bar chart (input vs. output)
- Trend line for average

**Use cases:**
- Cost forecasting
- Identifying verbose prompts
- Optimizing token efficiency

### Cost Analysis

**What it measures:** Estimated costs based on token usage

**Calculation:**
```
Cost = (Input tokens × Input price) + (Output tokens × Output price)
```

**Pricing (example):**
- GPT-4: $0.03/1K input, $0.06/1K output
- Claude: $0.015/1K input, $0.075/1K output
- Gemini: $0.00025/1K input, $0.0005/1K output

**Metrics:**
- **Total cost** — Cumulative spend
- **Cost per request** — Average cost
- **Cost trend** — Daily/weekly spend
- **Projected monthly cost** — Based on current rate

**Chart:**
- Cost over time (line graph)
- Cost breakdown by prompt (pie chart)

## Advanced Analytics

### Prompt Comparison

**Compare up to 3 prompts side-by-side:**

| Metric | Prompt A | Prompt B | Prompt C |
|--------|----------|----------|----------|
| Requests | 10,000 | 8,500 | 12,000 |
| Success Rate | 97% | 94% | 98% |
| p95 Latency | 1,200ms | 1,800ms | 1,000ms |
| Avg Tokens | 250 | 300 | 200 |
| Cost/Request | $0.015 | $0.020 | $0.012 |
| **Winner** | 2nd | 3rd | **1st** |

**Use cases:**
- A/B testing in production
- Identifying best-performing prompts
- Deciding which prompts to optimize

### Cohort Analysis

**Group requests by:**
- **Time cohorts:** Hourly, daily, weekly
- **User cohorts:** New vs. returning users
- **Feature cohorts:** Different app features
- **Version cohorts:** Prompt versions

**Example:**
```
Prompt v2.0 vs v2.1 (last 7 days)
- v2.0: 95% success, 1,500ms p95, $0.018/req
- v2.1: 98% success, 1,200ms p95, $0.015/req
→ v2.1 is better, migrate all traffic
```

### Anomaly Detection

**Automatic alerts for:**
- **Sudden traffic spikes** (>2x normal)
- **Success rate drops** (<90%)
- **Latency spikes** (p95 >2x baseline)
- **Error rate increases** (>5%)
- **Cost anomalies** (>1.5x expected)

**Alert channels:**
- In-app notifications
- Email alerts
- Webhook integrations (Slack, PagerDuty)

### Custom Metrics

**Define custom metrics:**
- **Business metrics:** Conversion rate, user satisfaction
- **Quality metrics:** Output length, sentiment
- **Behavioral metrics:** Retry rate, edit rate

**Example custom metric:**
```
Name: Customer Satisfaction
Formula: (Positive feedback / Total feedback) × 100
Threshold: >80%
Alert: If <80% for 1 hour
```

## Dashboards and Reports

### Pre-built Dashboards

**1. Executive Dashboard**
- High-level KPIs
- Cost summary
- Traffic overview
- Top issues

**2. Performance Dashboard**
- Latency percentiles
- Success rates
- Error breakdown
- Throughput

**3. Cost Dashboard**
- Spend by prompt
- Spend by time
- Cost trends
- Budget tracking

**4. Quality Dashboard**
- Output quality scores
- Consistency metrics
- User feedback
- A/B test results

### Custom Dashboards

**Create your own:**
1. Click "New Dashboard"
2. Add widgets:
   - Charts (line, bar, pie)
   - Tables
   - Metrics cards
   - Alerts
3. Configure data sources
4. Arrange layout
5. Save and share

### Scheduled Reports

**Email reports automatically:**
- **Daily:** Morning summary
- **Weekly:** Performance review
- **Monthly:** Executive report

**Report contents:**
- Key metrics summary
- Trends and insights
- Alerts and issues
- Recommendations

## Alerting and Monitoring

### Alert Configuration

**Set up alerts:**
1. Go to Alerts tab
2. Click "New Alert"
3. Configure:
   - **Metric:** What to monitor
   - **Condition:** Threshold and comparison
   - **Duration:** How long before alerting
   - **Severity:** Info, Warning, Critical
   - **Channels:** Where to send alerts
4. Save alert

**Example alerts:**
```
Alert 1:
- Metric: Success Rate
- Condition: <95%
- Duration: 5 minutes
- Severity: Warning
- Channel: Email

Alert 2:
- Metric: p99 Latency
- Condition: >5000ms
- Duration: 2 minutes
- Severity: Critical
- Channel: Slack, PagerDuty
```

### Alert Response Workflow

**When alert fires:**
1. **Notification** — Receive alert via configured channel
2. **Investigate** — Click alert to see details
3. **Diagnose:**
   - Check error logs
   - Review recent changes
   - Compare with baseline
4. **Mitigate:**
   - Rollback prompt version
   - Scale resources
   - Apply hotfix
5. **Resolve** — Mark alert as resolved
6. **Post-mortem** — Document cause and prevention

### SLA Monitoring

**Define SLAs (Service Level Agreements):**
- **Availability:** 99.9% uptime
- **Latency:** p95 <2000ms
- **Success Rate:** >95%

**Track SLA compliance:**
- Current status (meeting/violating)
- Historical compliance (last 30 days)
- SLA budget remaining (error budget)

**Example:**
```
SLA: 99.9% availability (43 minutes downtime/month allowed)
Current month:
- Downtime: 12 minutes
- Budget remaining: 31 minutes
- Status: ✓ Meeting SLA
```

## Integration and Automation

### API Integration

**Export metrics via API:**
```bash
GET /api/metrics?prompt_id=abc123&start=2024-01-01&end=2024-01-31
```

**Response:**
```json
{
  "prompt_id": "abc123",
  "period": "2024-01-01 to 2024-01-31",
  "metrics": {
    "total_requests": 50000,
    "success_rate": 97.5,
    "avg_latency_ms": 1250,
    "p95_latency_ms": 2100,
    "total_tokens": 12500000,
    "total_cost_usd": 625.50
  }
}
```

### Webhook Alerts

**Send alerts to external systems:**
```json
{
  "alert_type": "latency_spike",
  "severity": "warning",
  "prompt_id": "abc123",
  "metric": "p95_latency",
  "value": 3500,
  "threshold": 2000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Auto-scaling

**Trigger actions based on metrics:**
- **High traffic** → Scale up resources
- **Low traffic** → Scale down to save costs
- **High error rate** → Rollback to previous version
- **High latency** → Switch to faster model

## Best Practices

✅ **DO:**
- Monitor all production prompts
- Set up alerts for critical metrics
- Review metrics daily
- Track costs and optimize
- Use percentiles (not just averages)
- Compare prompt versions
- Export data for long-term analysis

❌ **DON'T:**
- Ignore warning alerts
- Deploy without monitoring
- Rely only on success rate (check latency too)
- Forget to set cost budgets
- Over-alert (alert fatigue)
- Skip post-mortem after incidents

## Workflow Examples

### Example 1: Daily Monitoring Routine

```
Morning (9 AM):
1. Open Production Metrics dashboard
2. Check overnight alerts (if any)
3. Review key metrics:
   - Success rate: 98% ✓
   - p95 latency: 1,200ms ✓
   - Error rate: 1.5% ✓
   - Cost: On budget ✓
4. No issues → Continue monitoring

Afternoon (2 PM):
5. Check real-time metrics
6. Notice latency spike: p95 = 3,500ms ⚠️
7. Investigate:
   - Recent deployment? Yes, v2.3 deployed 1 hour ago
   - Compare v2.2 vs v2.3: v2.3 is slower
8. Rollback to v2.2
9. Latency returns to normal
10. Document incident
```

### Example 2: Cost Optimization

```
Week 1:
1. Review monthly cost projection: $5,000
2. Budget: $3,000
3. Need to reduce by 40%

Week 2:
4. Analyze cost breakdown:
   - Prompt A: $2,000 (40%)
   - Prompt B: $1,500 (30%)
   - Prompt C: $1,500 (30%)
5. Focus on Prompt A (highest cost)
6. Check metrics:
   - Avg tokens: 500 (very high)
   - Many verbose outputs
7. Optimize Prompt A for token efficiency
8. Deploy optimized version

Week 3:
9. Monitor new costs:
   - Prompt A: $1,200 (40% reduction)
   - Total projected: $3,700
10. Still over budget, optimize Prompt B

Week 4:
11. Final costs: $2,900
12. Under budget ✓
```

### Example 3: A/B Test Analysis

```
Setup:
1. Deploy Prompt A (current) and Prompt B (new)
2. Split traffic 50/50
3. Run for 7 days

Day 7:
4. Compare metrics:
   - Prompt A: 96% success, 1,500ms p95, $0.020/req
   - Prompt B: 98% success, 1,200ms p95, $0.015/req
5. Prompt B wins on all metrics
6. Migrate 100% traffic to Prompt B
7. Monitor for 24 hours
8. No issues → Archive Prompt A
```

## Troubleshooting

**Problem:** "Metrics not updating"
- **Solution:** Check if prompt is actually deployed, verify API integration, refresh dashboard

**Problem:** "High latency but low error rate"
- **Solution:** LLM is slow but working. Consider faster model, optimize prompt length, add caching

**Problem:** "Costs higher than expected"
- **Solution:** Check for token bloat, verbose outputs, unnecessary requests, optimize prompts

**Problem:** "Success rate dropped suddenly"
- **Solution:** Check recent deployments, review error logs, compare with previous version, rollback if needed

## Next Steps

1. **Set up alerts** → Configure critical metric alerts
2. **Create dashboards** → Customize for your needs
3. **Optimize costs** → Identify and reduce expensive prompts
4. **Track changes** → Go to DEPLOY: History
5. **Improve prompts** → Go to CREATE: Optimizer

---

**Related Sections:**
- [Library](#) — Manage deployed prompts
- [History](#) — Track deployment history
- [Evaluation](#) — Test before deploying
- [Settings](#) — Configure monitoring
