import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Types
interface ReportData {
  user: {
    name: string
    role: string
    group: string | null
  }
  period: string
  stats: {
    totalDeliveries: number
    successfulDeliveries: number
    successRate: string
    totalDistance: number
    totalCollisions: number
    avgDuration: number
  }
  deliveries: Array<{
    date: string
    status: string
    distance: number
    duration: number
    collisions: number
    scenario: string
  }>
  algorithms: Array<{
    name: string
    language: string
    runs: number
    avgScore: number
    createdAt: string
  }>
}

export async function POST(request: NextRequest) {
  let scriptPath: string | null = null
  let outputPath: string | null = null
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true, group: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type') || 'performance'
    const period = searchParams.get('period') || 'all'

    // Get user stats
    const deliveries = await db.deliveryResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const totalDeliveries = deliveries.length
    const successfulDeliveries = deliveries.filter(d => d.status === 'success').length
    const totalDistance = deliveries.reduce((sum, d) => sum + (d.distance || 0), 0)
    const totalCollisions = deliveries.reduce((sum, d) => sum + (d.collisions || 0), 0)
    const avgDuration = totalDeliveries > 0
      ? deliveries.reduce((sum, d) => sum + (d.duration || 0), 0) / totalDeliveries
      : 0

    // Get algorithms
    const algorithms = await db.algorithm.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    // Get leaderboard position
    const allUsers = await db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        totalDeliveries: true,
        totalCollisions: true,
        totalDistance: true
      }
    })

    // Calculate leaderboard
    const leaderboard = allUsers
      .map(u => ({
        name: u.name,
        deliveries: u.totalDeliveries,
        distance: u.totalDistance,
        collisions: u.totalCollisions,
        score: u.totalDeliveries * 10 + (u.totalDistance / 100) - u.totalCollisions * 5
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    const userRank = leaderboard.findIndex(u => u.name === user.name) + 1

    // Generate PDF using Python
    const outputDir = '/home/z/my-project/download'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const timestamp = Date.now()
    outputPath = path.join(outputDir, `report-${user.id}-${new Date().toISOString()}.pdf`)
    scriptPath = path.join('/tmp', `report_${timestamp}.py`)

    const pythonScript = `
import json
import sys
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
pdfmetrics.registerFont(TTFont('Times', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

# Read data from stdin
data = json.loads(sys.stdin.read())

# Create PDF
doc = SimpleDocTemplate(
    sys.argv[1],
    pagesize=A4,
    title=f"Robot Simulator Report - {data['user']['name']}",
    author='Z.ai',
    creator='Z.ai'
)

story = []
styles = getSampleStyleSheet()

# Title style
styles.add(ParagraphStyle(
    name='TitleRU',
    fontName='Times',
    fontSize=24,
    alignment=TA_CENTER,
    spaceAfter=30
))

# Heading style
styles.add(ParagraphStyle(
    name='HeadingRU',
    fontName='Times',
    fontSize=14,
    spaceBefore=20,
    spaceAfter=10
))

# Body style
styles.add(ParagraphStyle(
    name='BodyRU',
    fontName='Times',
    fontSize=10,
    spaceAfter=6
))

# Title
story.append(Paragraph("Robot Delivery Simulator Report", styles['TitleRU']))
story.append(Spacer(1, 20))

# User info
story.append(Paragraph(f"User: {data['user']['name']}", styles['HeadingRU']))
story.append(Paragraph(f"Role: {data['user']['role']}", styles['BodyRU']))
story.append(Paragraph(f"Group: {data['user'].get('group', 'N/A')}", styles['BodyRU']))
story.append(Paragraph(f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['BodyRU']))
story.append(Spacer(1, 20))

# Stats table
story.append(Paragraph("Performance Summary", styles['HeadingRU']))

stats_data = [
    ['Total Deliveries', str(data['stats']['totalDeliveries'])],
    ['Success Rate', f"{data['stats']['successRate']}%"],
    ['Total Distance', f"{data['stats']['totalDistance']}m"],
    ['Total Collisions', str(data['stats']['totalCollisions'])],
    ['Avg Duration', f"{data['stats']['avgDuration']}s"],
]

stats_table = Table(stats_data, colWidths=[200, 200])
stats_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
]))
story.append(stats_table)
story.append(Spacer(1, 30))

# Recent deliveries
if data.get('deliveries') and len(data['deliveries']) > 0:
    story.append(Paragraph("Recent Deliveries", styles['HeadingRU']))
    
    delivery_data = [['Date', 'Status', 'Distance', 'Time', 'Collisions']]
    for d in data['deliveries'][:10]:
        delivery_data.append([
            d['date'][:10] if d.get('date') else 'N/A',
            d.get('status', 'N/A'),
            f"{d.get('distance', 0)}m",
            f"{d.get('duration', 0)}s",
            str(d.get('collisions', 0))
        ])
    
    if len(delivery_data) > 1:
        delivery_table = Table(delivery_data, colWidths=[80, 80, 80, 80, 80])
        delivery_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        story.append(delivery_table)
        story.append(Spacer(1, 30))

# Algorithms
if data.get('algorithms') and len(data['algorithms']) > 0:
    story.append(Paragraph("Algorithms", styles['HeadingRU']))
    
    algo_data = [['Name', 'Language', 'Runs', 'Avg Score']]
    for a in data['algorithms'][:5]:
        algo_data.append([
            a.get('name', 'N/A')[:20],
            a.get('language', 'N/A'),
            str(a.get('runs', 0)),
            f"{a.get('avgScore', 0):.1f}"
        ])
    
    if len(algo_data) > 1:
        algo_table = Table(algo_data, colWidths=[120, 80, 60, 80])
        algo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        story.append(algo_table)

# Build PDF
doc.build(story)
print("PDF_GENERATED_SUCCESS")
`

    // Write script
    fs.writeFileSync(scriptPath, pythonScript)

    // Prepare data
    const reportData: ReportData = {
      user: {
        name: user.name || 'Unknown',
        role: user.role,
        group: user.group
      },
      period,
      stats: {
        totalDeliveries,
        successfulDeliveries,
        successRate: totalDeliveries > 0 
          ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) 
          : '0',
        totalDistance: Math.round(totalDistance),
        totalCollisions,
        avgDuration: Math.round(avgDuration)
      },
      deliveries: deliveries.slice(0, 20).map(d => ({
        date: new Date(d.createdAt).toISOString(),
        status: d.status,
        distance: Math.round(d.distance || 0),
        duration: d.duration || 0,
        collisions: d.collisions || 0,
        scenario: d.scenarioName || 'Unknown'
      })),
      algorithms: algorithms.map(a => ({
        name: a.name,
        language: a.language,
        runs: a.runsCount,
        avgScore: a.avgScore,
        createdAt: new Date(a.createdAt).toISOString()
      }))
    }

    // Run Python script
    const result = execSync(`python3 ${scriptPath} ${outputPath}`, {
      input: JSON.stringify(reportData),
      encoding: 'utf-8',
      timeout: 30000
    })

    if (!result.includes('PDF_GENERATED_SUCCESS')) {
      console.error('PDF generation failed:', result)
      return NextResponse.json({ error: 'Ошибка генерации PDF' }, { status: 500 })
    }

    // Check file exists
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({ error: 'PDF файл не создан' }, { status: 500 })
    }

    // Return file
    const fileBuffer = fs.readFileSync(outputPath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="robot-simulator-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Ошибка генерации отчёта', details: String(error) },
      { status: 500 }
    )
  } finally {
    // Cleanup
    try {
      if (scriptPath && fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath)
      }
      if (outputPath && fs.existsSync(outputPath)) {
        setTimeout(() => {
          try { fs.unlinkSync(outputPath) } catch {}
        }, 10000)
      }
    } catch {}
  }
}
