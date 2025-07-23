const fs = require('fs');

class EnhancedIOSAnalyzer {
    constructor() {
        this.issues = [];
        this.analysis = {};
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    parseCSV(filePath) {
        console.log('📊 Parsing CSV data...');
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        
        const headers = this.parseCSVLine(lines[0]);
        console.log(`Found ${headers.length} columns`);
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            try {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= headers.length - 5) {
                    const issue = {};
                    headers.forEach((header, index) => {
                        issue[header] = values[index] || '';
                    });
                    
                    if (issue.s_meta_other_platform === 'ios') {
                        this.issues.push(issue);
                    }
                }
            } catch (error) {
                // Skip malformed lines
            }
            
            if (i % 1000 === 0) {
                console.log(`Processed ${i} lines...`);
            }
        }
        
        console.log(`✅ Parsed ${this.issues.length} iOS issues from ${lines.length} total lines`);
    }

    // Enhanced crash/freeze pattern detection
    detectSpecificPatterns(issue) {
        const title = (issue.s_issue_title || '').toLowerCase();
        const tags = (issue.a_tags || '').toLowerCase();
        const messages = (issue.s_messages || '').toLowerCase();
        
        const patterns = {
            // Critical crash patterns
            hardCrash: {
                regex: /\b(crash|crashed|crashes|crashing|app (closes|closed|shuts down|force close))\b/,
                severity: 'critical',
                description: 'App completely crashes or force closes'
            },
            suddenExit: {
                regex: /\b(suddenly (stops|exits|quits)|app disappears|unexpected(ly)? (close|exit))\b/,
                severity: 'critical', 
                description: 'App exits without warning'
            },
            
            // Freeze/stuck patterns
            freeze: {
                regex: /\b(freeze|frozen|freezes|freezing|not responding|unresponsive)\b/,
                severity: 'high',
                description: 'App becomes unresponsive'
            },
            rewardStuck: {
                regex: /\b(reward.*stuck|can't claim|reward.*freeze|reward.*not working)\b/,
                severity: 'high',
                description: 'Reward screen or claiming mechanism stuck'
            },
            loadingStuck: {
                regex: /\b(loading (stuck|forever|infinite)|won't load|stuck.*loading)\b/,
                severity: 'medium',
                description: 'Loading screens that never complete'
            },
            
            // Progress/data issues
            progressLost: {
                regex: /\b(progress.*lost|reset.*progress|back to zero|lost.*items|bag.*zero)\b/,
                severity: 'high',
                description: 'User progress or items lost/reset'
            },
            
            // UI/interaction issues
            uiStuck: {
                regex: /\b(stuck|hanging|hangs|tap.*not.*work|button.*not.*work)\b/,
                severity: 'medium',
                description: 'UI elements not responding to interaction'
            },
            
            // Performance issues
            performanceLag: {
                regex: /\b(lag|lagging|slow|sluggish|choppy|stuttering|fps)\b/,
                severity: 'low',
                description: 'Performance and responsiveness issues'
            },
            
            // Visual issues
            blackScreen: {
                regex: /\b(black screen|blank screen|white screen|screen.*blank)\b/,
                severity: 'medium',
                description: 'Display issues and blank screens'
            }
        };
        
        const detected = {};
        const fullText = `${title} ${tags} ${messages}`;
        
        Object.entries(patterns).forEach(([key, pattern]) => {
            detected[key] = {
                found: pattern.regex.test(fullText),
                severity: pattern.severity,
                description: pattern.description
            };
        });
        
        return detected;
    }

    analyzeEnhanced() {
        console.log('\n🔍 Enhanced analysis with pattern detection...');
        
        const versionGroups = {};
        const dailyTrends = {};
        const patternAnalysis = {};
        const tagPatterns = {};
        
        this.issues.forEach(issue => {
            const appVersion = issue.s_meta_application_version || 'Unknown';
            const createdDate = issue.d_created_date || 'Unknown';
            const tags = issue.a_tags || '[]';
            const osVersion = issue.s_meta_other_os_version || 'Unknown';
            const country = issue.s_meta_other_country_code || 'Unknown';
            
            // Initialize version group
            if (!versionGroups[appVersion]) {
                versionGroups[appVersion] = {
                    count: 0,
                    patterns: {},
                    osVersions: new Set(),
                    countries: new Set(),
                    tagBreakdown: {},
                    dates: [],
                    severityCount: { critical: 0, high: 0, medium: 0, low: 0 }
                };
            }
            
            // Detect specific patterns
            const detectedPatterns = this.detectSpecificPatterns(issue);
            Object.entries(detectedPatterns).forEach(([patternName, patternData]) => {
                if (patternData.found) {
                    // Version-specific pattern tracking
                    if (!versionGroups[appVersion].patterns[patternName]) {
                        versionGroups[appVersion].patterns[patternName] = 0;
                    }
                    versionGroups[appVersion].patterns[patternName]++;
                    versionGroups[appVersion].severityCount[patternData.severity]++;
                    
                    // Global pattern analysis
                    if (!patternAnalysis[patternName]) {
                        patternAnalysis[patternName] = {
                            total: 0,
                            severity: patternData.severity,
                            description: patternData.description,
                            versions: {},
                            trend: [],
                            topVersions: new Set()
                        };
                    }
                    patternAnalysis[patternName].total++;
                    patternAnalysis[patternName].versions[appVersion] = 
                        (patternAnalysis[patternName].versions[appVersion] || 0) + 1;
                    patternAnalysis[patternName].topVersions.add(appVersion);
                }
            });
            
            // Version data
            versionGroups[appVersion].count++;
            versionGroups[appVersion].osVersions.add(osVersion);
            versionGroups[appVersion].countries.add(country);
            versionGroups[appVersion].dates.push(createdDate);
            
            // Process tags
            try {
                const tagArray = JSON.parse(tags);
                tagArray.forEach(tag => {
                    if (!versionGroups[appVersion].tagBreakdown[tag]) {
                        versionGroups[appVersion].tagBreakdown[tag] = 0;
                    }
                    versionGroups[appVersion].tagBreakdown[tag]++;
                    
                    if (!tagPatterns[tag]) {
                        tagPatterns[tag] = { count: 0, versions: new Set() };
                    }
                    tagPatterns[tag].count++;
                    tagPatterns[tag].versions.add(appVersion);
                });
            } catch (e) {
                // Handle non-JSON format
                if (tags && tags !== '[]') {
                    const simpleTag = tags.replace(/[\[\]"]/g, '');
                    if (!versionGroups[appVersion].tagBreakdown[simpleTag]) {
                        versionGroups[appVersion].tagBreakdown[simpleTag] = 0;
                    }
                    versionGroups[appVersion].tagBreakdown[simpleTag]++;
                }
            }
            
            // Daily trends
            if (!dailyTrends[createdDate]) {
                dailyTrends[createdDate] = {
                    total: 0,
                    versions: {},
                    patterns: {},
                    severity: { critical: 0, high: 0, medium: 0, low: 0 }
                };
            }
            dailyTrends[createdDate].total++;
            dailyTrends[createdDate].versions[appVersion] = 
                (dailyTrends[createdDate].versions[appVersion] || 0) + 1;
            
            // Daily pattern tracking
            Object.entries(detectedPatterns).forEach(([patternName, patternData]) => {
                if (patternData.found) {
                    dailyTrends[createdDate].patterns[patternName] = 
                        (dailyTrends[createdDate].patterns[patternName] || 0) + 1;
                    dailyTrends[createdDate].severity[patternData.severity]++;
                }
            });
        });
        
        // Convert Sets to arrays for JSON serialization
        Object.keys(versionGroups).forEach(version => {
            versionGroups[version].osVersions = Array.from(versionGroups[version].osVersions);
            versionGroups[version].countries = Array.from(versionGroups[version].countries);
        });
        
        Object.keys(patternAnalysis).forEach(pattern => {
            patternAnalysis[pattern].topVersions = Array.from(patternAnalysis[pattern].topVersions);
        });
        
        Object.keys(tagPatterns).forEach(tag => {
            tagPatterns[tag].versions = Array.from(tagPatterns[tag].versions);
        });
        
        this.analysis = {
            versionGroups,
            dailyTrends,
            patternAnalysis,
            tagPatterns,
            totalIssues: this.issues.length
        };
        
        console.log(`✅ Enhanced analysis complete! Detected ${Object.keys(patternAnalysis).length} pattern types`);
    }

    generatePlainEnglishInsights() {
        const { versionGroups, dailyTrends, patternAnalysis, totalIssues } = this.analysis;
        
        const insights = [];
        
        // Version analysis
        const sortedVersions = Object.entries(versionGroups)
            .sort(([,a], [,b]) => b.count - a.count);
        
        const topVersion = sortedVersions[0];
        const topIssuePercent = ((topVersion[1].count / totalIssues) * 100).toFixed(1);
        
        insights.push(`**Version Analysis:** Version ${topVersion[0]} is responsible for ${topIssuePercent}% of all iOS issues (${topVersion[1].count} out of ${totalIssues}). This suggests a significant regression in this version.`);
        
        // Critical pattern analysis
        const criticalPatterns = Object.entries(patternAnalysis)
            .filter(([, data]) => data.severity === 'critical')
            .sort(([,a], [,b]) => b.total - a.total);
        
        if (criticalPatterns.length > 0) {
            const topCritical = criticalPatterns[0];
            const affectedVersions = Object.keys(topCritical[1].versions).length;
            insights.push(`**Critical Alert:** "${topCritical[1].description}" affects ${affectedVersions} versions with ${topCritical[1].total} total cases. This is a high-priority issue requiring immediate attention.`);
        }
        
        // Daily trend analysis
        const sortedDates = Object.keys(dailyTrends).sort();
        const dailyVolumes = sortedDates.map(date => dailyTrends[date].total);
        const avgDaily = dailyVolumes.reduce((a, b) => a + b, 0) / dailyVolumes.length;
        const spikes = sortedDates.filter(date => dailyTrends[date].total > avgDaily * 1.5);
        
        if (spikes.length > 0) {
            const biggestSpike = spikes.reduce((max, date) => 
                dailyTrends[date].total > dailyTrends[max].total ? date : max
            );
            const spikeVolume = dailyTrends[biggestSpike].total;
            const spikeIncrease = ((spikeVolume / avgDaily - 1) * 100).toFixed(0);
            
            insights.push(`**Trend Alert:** ${biggestSpike} showed a ${spikeIncrease}% spike in issues (${spikeVolume} vs ${avgDaily.toFixed(0)} average). This suggests a significant incident or release impact.`);
        }
        
        // Pattern severity distribution
        const totalSeverityCount = { critical: 0, high: 0, medium: 0, low: 0 };
        Object.values(versionGroups).forEach(version => {
            Object.entries(version.severityCount).forEach(([severity, count]) => {
                totalSeverityCount[severity] += count;
            });
        });
        
        const criticalPercent = ((totalSeverityCount.critical / totalIssues) * 100).toFixed(1);
        if (totalSeverityCount.critical > 0) {
            insights.push(`**Severity Distribution:** ${criticalPercent}% of issues are critical (${totalSeverityCount.critical} cases), indicating severe stability problems that could drive user churn.`);
        }
        
        // Cross-version pattern detection
        const crossVersionPatterns = Object.entries(patternAnalysis)
            .filter(([, data]) => Object.keys(data.versions).length >= 3)
            .sort(([,a], [,b]) => Object.keys(b.versions).length - Object.keys(a.versions).length);
        
        if (crossVersionPatterns.length > 0) {
            const topCrossPattern = crossVersionPatterns[0];
            insights.push(`**Cross-Version Issue:** "${topCrossPattern[1].description}" appears across ${Object.keys(topCrossPattern[1].versions).length} different versions, suggesting a fundamental design or architecture problem.`);
        }
        
        // iOS compatibility insights
        const iosVersionIssues = {};
        Object.values(versionGroups).forEach(version => {
            version.osVersions.forEach(osVersion => {
                if (!iosVersionIssues[osVersion]) {
                    iosVersionIssues[osVersion] = 0;
                }
                iosVersionIssues[osVersion] += version.count;
            });
        });
        
        const topIOSVersion = Object.entries(iosVersionIssues)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (topIOSVersion) {
            const iosPercent = ((topIOSVersion[1] / totalIssues) * 100).toFixed(1);
            insights.push(`**iOS Compatibility:** iOS ${topIOSVersion[0]} accounts for ${iosPercent}% of issues. Consider focused testing and optimization for this iOS version.`);
        }
        
        // Recommendations
        const recommendations = [];
        
        if (topVersion[1].count > totalIssues * 0.3) {
            recommendations.push(`Immediately investigate Version ${topVersion[0]} for regressions`);
        }
        
        if (totalSeverityCount.critical > 0) {
            recommendations.push(`Address ${totalSeverityCount.critical} critical stability issues as highest priority`);
        }
        
        if (spikes.length > 0) {
            recommendations.push(`Review deployment and release processes around spike dates`);
        }
        
        const topPattern = Object.entries(patternAnalysis)
            .sort(([,a], [,b]) => b.total - a.total)[0];
        if (topPattern) {
            recommendations.push(`Focus QA testing on "${topPattern[1].description}" scenarios`);
        }
        
        insights.push(`**Recommendations:** ${recommendations.join('. ')}.`);
        
        return insights;
    }

    generateInteractiveReport() {
        console.log('\n📝 Generating enhanced interactive report...');
        
        const { versionGroups, dailyTrends, patternAnalysis, tagPatterns, totalIssues } = this.analysis;
        
        // Sort and prepare data
        const sortedVersions = Object.entries(versionGroups)
            .sort(([,a], [,b]) => b.count - a.count);
        
        const sortedDates = Object.keys(dailyTrends).sort();
        
        // Prepare chart data
        const versionChartData = sortedVersions.map(([version, data]) => ({
            version,
            count: data.count,
            patterns: data.patterns,
            tagBreakdown: data.tagBreakdown,
            severityCount: data.severityCount,
            criticalRate: (data.severityCount.critical / data.count * 100).toFixed(1),
            osVersions: data.osVersions,
            countries: data.countries
        }));
        
        const dailyChartData = sortedDates.map(date => ({
            date,
            total: dailyTrends[date].total,
            versions: dailyTrends[date].versions,
            patterns: dailyTrends[date].patterns,
            severity: dailyTrends[date].severity
        }));
        
        const insights = this.generatePlainEnglishInsights();
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced iOS Analysis - Version Patterns & Trends</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 20px; background: #f5f5f7; line-height: 1.6;
        }
        .container { max-width: 1600px; margin: 0 auto; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 40px; border-radius: 12px; 
            margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .card { 
            background: white; padding: 25px; border-radius: 12px; 
            margin-bottom: 25px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); 
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 25px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
        .chart-container { position: relative; height: 450px; margin: 20px 0; }
        .metric { 
            display: inline-block; margin: 15px 25px 15px 0; 
            padding: 20px; background: rgba(255,255,255,0.9); border-radius: 10px; 
        }
        .metric-value { font-size: 28px; font-weight: bold; color: #007AFF; }
        .metric-label { font-size: 14px; color: #666; margin-top: 8px; }
        
        .insight-card { 
            background: #f8f9fb; border-left: 4px solid #007AFF; 
            padding: 20px; margin: 15px 0; border-radius: 0 8px 8px 0; 
        }
        .insight-text { font-size: 16px; margin-bottom: 10px; }
        .insight-text strong { color: #1d1d1f; }
        
        .pattern-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
        .pattern-card { 
            border-radius: 10px; padding: 18px; margin: 8px 0; color: white; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .pattern-critical { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); }
        .pattern-high { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .pattern-medium { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .pattern-low { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        
        .pattern-title { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
        .pattern-details { font-size: 14px; opacity: 0.9; }
        .pattern-count { font-size: 18px; font-weight: bold; margin-top: 5px; }
        
        .trend-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .trend-table th, .trend-table td { 
            padding: 15px; text-align: left; border-bottom: 2px solid #f0f0f0; 
        }
        .trend-table th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; font-weight: 600; 
        }
        .trend-spike { background: #ffe6e6; color: #d73527; font-weight: bold; }
        .trend-normal { background: #e6f7e6; color: #27d754; }
        
        .version-bar { 
            cursor: pointer; transition: all 0.3s ease; 
            border-radius: 6px; margin: 2px 0;
        }
        .version-bar:hover { 
            transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
        }
        
        .tooltip {
            position: absolute; background: rgba(0,0,0,0.9); color: white;
            padding: 15px; border-radius: 8px; font-size: 13px;
            pointer-events: none; z-index: 1000; display: none;
            max-width: 300px; line-height: 1.4;
        }
        
        .alert-banner {
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            color: white; padding: 20px; border-radius: 10px; margin: 20px 0;
            font-weight: bold; text-align: center; font-size: 18px;
        }
        
        .warning-banner {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white; padding: 15px; border-radius: 10px; margin: 15px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div id="tooltip" class="tooltip"></div>
    
    <div class="container">
        <div class="header">
            <h1>🍎 Enhanced iOS Version Analysis</h1>
            <p>Advanced pattern detection and trend analysis for ${totalIssues} unresolved iOS issues</p>
            <div>
                <div class="metric">
                    <div class="metric-value">${totalIssues}</div>
                    <div class="metric-label">Total iOS Issues</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Object.keys(versionGroups).length}</div>
                    <div class="metric-label">App Versions</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Object.keys(patternAnalysis).length}</div>
                    <div class="metric-label">Pattern Types</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${sortedDates.length}</div>
                    <div class="metric-label">Days Analyzed</div>
                </div>
            </div>
        </div>

        <!-- Plain English Insights -->
        <div class="card">
            <h2>📋 Executive Summary & Key Insights</h2>
            ${insights.map(insight => `
                <div class="insight-card">
                    <div class="insight-text">${insight}</div>
                </div>
            `).join('')}
        </div>

        <!-- Interactive Charts -->
        <div class="grid">
            <div class="card">
                <h2>📊 Interactive Version Analysis</h2>
                <p><strong>Hover over bars</strong> to see detailed breakdown of patterns and tags</p>
                <div class="chart-container">
                    <canvas id="versionChart"></canvas>
                </div>
            </div>

            <div class="card">
                <h2>📈 Daily Issue Trends</h2>
                <p><strong>Spike detection</strong> and version correlation over time</p>
                <div class="chart-container">
                    <canvas id="dailyChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Pattern Detection Results -->
        <div class="card">
            <h2>🔍 Specific Pattern Detection Results</h2>
            <p>Advanced pattern matching beyond basic tags - identifying specific crash and freeze scenarios</p>
            <div class="pattern-grid">
                ${Object.entries(patternAnalysis)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .slice(0, 8)
                    .map(([pattern, data]) => {
                        const topVersion = Object.entries(data.versions)
                            .sort(([,a], [,b]) => b - a)[0];
                        return `
                        <div class="pattern-card pattern-${data.severity}">
                            <div class="pattern-title">${this.formatPatternName(pattern)}</div>
                            <div class="pattern-details">${data.description}</div>
                            <div class="pattern-count">${data.total} cases</div>
                            <div class="pattern-details">
                                Most affected: Version ${topVersion[0]} (${topVersion[1]} cases)
                                <br>Spans ${Object.keys(data.versions).length} versions
                            </div>
                        </div>
                        `;
                    }).join('')}
            </div>
        </div>

        <!-- Daily Spike Analysis -->
        <div class="card">
            <h2>🚨 Daily Spike Analysis & Trend Detection</h2>
            <p>Identifies unusual volume days and correlates with versions and patterns</p>
            <table class="trend-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Issues</th>
                        <th>vs Average</th>
                        <th>Top Version</th>
                        <th>Critical Patterns</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateSpikeAnalysisTable(dailyChartData)}
                </tbody>
            </table>
        </div>

        <!-- Version Deep Dive -->
        <div class="card">
            <h2>🎯 Version-Specific Deep Dive</h2>
            <div class="grid-3">
                ${versionChartData.slice(0, 6).map(version => `
                    <div class="pattern-card ${version.criticalRate > 5 ? 'pattern-critical' : version.criticalRate > 2 ? 'pattern-high' : 'pattern-medium'}">
                        <div class="pattern-title">Version ${version.version}</div>
                        <div class="pattern-count">${version.count} total issues</div>
                        <div class="pattern-details">
                            <strong>Critical Rate:</strong> ${version.criticalRate}%<br>
                            <strong>Top Patterns:</strong> ${Object.entries(version.patterns)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 2)
                                .map(([pattern, count]) => `${this.formatPatternName(pattern)} (${count})`)
                                .join(', ') || 'None detected'}<br>
                            <strong>iOS Versions:</strong> ${version.osVersions.slice(0, 3).join(', ')}${version.osVersions.length > 3 ? '...' : ''}<br>
                            <strong>Countries:</strong> ${version.countries.slice(0, 4).join(', ')}${version.countries.length > 4 ? '...' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script>
        const versionData = ${JSON.stringify(versionChartData)};
        const dailyData = ${JSON.stringify(dailyChartData)};
        
        // Enhanced Version Chart with Hover Details
        const versionCtx = document.getElementById('versionChart').getContext('2d');
        const versionChart = new Chart(versionCtx, {
            type: 'bar',
            data: {
                labels: versionData.map(d => d.version),
                datasets: [{
                    label: 'Total Issues',
                    data: versionData.map(d => d.count),
                    backgroundColor: versionData.map(d => {
                        if (d.criticalRate > 5) return '#ff3b30';      // Critical: Red
                        if (d.criticalRate > 2) return '#ff9500';      // High: Orange  
                        if (d.criticalRate > 1) return '#007AFF';      // Medium: Blue
                        return '#34c759';                              // Low: Green
                    }),
                    borderColor: '#fff',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const version = versionData[context[0].dataIndex];
                                return \`Version \${version.version} - \${version.count} Issues\`;
                            },
                            afterLabel: function(context) {
                                const version = versionData[context.dataIndex];
                                const topPatterns = Object.entries(version.patterns)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 4)
                                    .map(([pattern, count]) => \`  • \${pattern}: \${count}\`)
                                    .join('\\n');
                                const topTags = Object.entries(version.tagBreakdown)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([tag, count]) => \`  • \${tag}: \${count}\`)
                                    .join('\\n');
                                return [
                                    \`Critical Rate: \${version.criticalRate}%\`,
                                    '',
                                    'Top Patterns:',
                                    topPatterns || '  None detected',
                                    '',
                                    'Top Tags:',
                                    topTags || '  None available'
                                ].join('\\n');
                            }
                        },
                        bodyFont: { size: 12 },
                        titleFont: { size: 14, weight: 'bold' },
                        padding: 12,
                        boxPadding: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Issues', font: { size: 14 } },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'App Version', font: { size: 14 } },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Enhanced Daily Trend Chart
        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        const avgDaily = dailyData.reduce((sum, d) => sum + d.total, 0) / dailyData.length;
        
        const dailyChart = new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: dailyData.map(d => d.date),
                datasets: [{
                    label: 'Daily Issues',
                    data: dailyData.map(d => d.total),
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: dailyData.map(d => 
                        d.total > avgDaily * 1.5 ? '#ff3b30' : '#007AFF'
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: dailyData.map(d => 
                        d.total > avgDaily * 1.5 ? 8 : 5
                    )
                }, {
                    label: 'Average',
                    data: new Array(dailyData.length).fill(avgDaily),
                    borderColor: '#ff9500',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const day = dailyData[context[0].dataIndex];
                                const spike = day.total > avgDaily * 1.5;
                                return \`\${day.date} \${spike ? '🚨 SPIKE' : ''}\`;
                            },
                            afterLabel: function(context) {
                                const day = dailyData[context.dataIndex];
                                const topVersion = Object.entries(day.versions)
                                    .sort(([,a], [,b]) => b - a)[0];
                                const topPatterns = Object.entries(day.patterns)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([pattern, count]) => \`  • \${pattern}: \${count}\`)
                                    .join('\\n');
                                return [
                                    \`vs Average: \${((day.total / avgDaily - 1) * 100).toFixed(0)}%\`,
                                    topVersion ? \`Top Version: \${topVersion[0]} (\${topVersion[1]} issues)\` : '',
                                    '',
                                    'Top Patterns:',
                                    topPatterns || '  None detected'
                                ].join('\\n');
                            }
                        },
                        bodyFont: { size: 12 },
                        titleFont: { size: 14, weight: 'bold' },
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Issues', font: { size: 14 } },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'Date', font: { size: 14 } },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    </script>
</body>
</html>
        `;
        
        fs.writeFileSync('enhanced-ios-report.html', html);
        console.log('✅ Enhanced interactive report generated: enhanced-ios-report.html');
    }

    formatPatternName(pattern) {
        const names = {
            hardCrash: 'Hard Crashes',
            suddenExit: 'Sudden Exit',
            freeze: 'App Freeze',
            rewardStuck: 'Reward Stuck',
            loadingStuck: 'Loading Stuck',
            progressLost: 'Progress Lost',
            uiStuck: 'UI Stuck',
            performanceLag: 'Performance Lag',
            blackScreen: 'Black Screen'
        };
        return names[pattern] || pattern.charAt(0).toUpperCase() + pattern.slice(1);
    }

    generateSpikeAnalysisTable(dailyData) {
        const avgIssues = dailyData.reduce((sum, day) => sum + day.total, 0) / dailyData.length;
        
        return dailyData
            .sort((a, b) => b.total - a.total)
            .slice(0, 15)
            .map(day => {
                const changePercent = ((day.total / avgIssues - 1) * 100).toFixed(0);
                const isSpike = day.total > avgIssues * 1.5;
                const topVersion = Object.entries(day.versions)
                    .sort(([,a], [,b]) => b - a)[0];
                const criticalPatterns = Object.entries(day.patterns)
                    .filter(([pattern]) => ['hardCrash', 'suddenExit', 'progressLost'].includes(pattern))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 2)
                    .map(([pattern, count]) => `${this.formatPatternName(pattern)} (${count})`)
                    .join(', ');
                
                return `
                <tr class="${isSpike ? 'trend-spike' : 'trend-normal'}">
                    <td><strong>${day.date}</strong></td>
                    <td>${day.total}</td>
                    <td>${changePercent > 0 ? '+' : ''}${changePercent}%</td>
                    <td>${topVersion ? `${topVersion[0]} (${topVersion[1]})` : 'N/A'}</td>
                    <td>${criticalPatterns || 'None detected'}</td>
                    <td><strong>${isSpike ? '🚨 SPIKE' : '📊 Normal'}</strong></td>
                </tr>
                `;
            }).join('');
    }

    run() {
        console.log('🚀 Starting Enhanced iOS Analysis with Pattern Detection...\n');
        
        const csvFile = 'unresolved_issues_past_3_months.csv';
        if (!fs.existsSync(csvFile)) {
            console.error('❌ CSV file not found:', csvFile);
            return;
        }
        
        this.parseCSV(csvFile);
        this.analyzeEnhanced();
        this.generateInteractiveReport();
        
        console.log('\n🎉 Enhanced analysis complete!');
        console.log('📄 Report: enhanced-ios-report.html');
        console.log('\n�� New Features:');
        console.log('  📊 Interactive charts with hover tooltips');
        console.log('  🔍 Advanced pattern detection (9 specific types)');
        console.log('  📈 Daily spike detection and trend analysis');
        console.log('  📋 Plain English executive summary');
        console.log('  🎯 Version-specific deep dive insights');
        console.log('  🚨 Critical pattern alerts with severity levels');
    }
}

const analyzer = new EnhancedIOSAnalyzer();
analyzer.run();
