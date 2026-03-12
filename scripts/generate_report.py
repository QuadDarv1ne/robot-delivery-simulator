#!/usr/bin/env python3
"""
PDF Report Generator for Robot Delivery Simulator
Generates professional reports in PDF format
"""

import os
import sys
import json
import argparse
from datetime import datetime
from decimal import Decimal

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
FONT_DIR = '/usr/share/fonts/truetype'
pdfmetrics.registerFont(TTFont('SimHei', f'{FONT_DIR}/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', f'{FONT_DIR}/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', f'{FONT_DIR}/english/Times-New-Roman.ttf'))

registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')


def create_styles():
    """Create paragraph styles for the document"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='TitleRU',
        fontName='Microsoft YaHei',
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        spaceAfter=20
    ))
    
    # Heading 1
    styles.add(ParagraphStyle(
        name='Heading1RU',
        fontName='Microsoft YaHei',
        fontSize=16,
        leading=20,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#1F4E79')
    ))
    
    # Heading 2
    styles.add(ParagraphStyle(
        name='Heading2RU',
        fontName='Microsoft YaHei',
        fontSize=14,
        leading=18,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#2E75B6')
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyRU',
        fontName='SimHei',
        fontSize=10,
        leading=16,
        alignment=TA_LEFT,
        spaceAfter=8,
        wordWrap='CJK'
    ))
    
    # Table header style
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Microsoft YaHei',
        fontSize=10,
        textColor=colors.white,
        alignment=TA_CENTER
    ))
    
    # Table cell style
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='SimHei',
        fontSize=9,
        alignment=TA_CENTER,
        wordWrap='CJK'
    ))
    
    # Caption style
    styles.add(ParagraphStyle(
        name='Caption',
        fontName='SimHei',
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666'),
        spaceBefore=6,
        spaceAfter=12
    ))
    
    return styles


def format_duration(seconds):
    """Format duration in seconds to human readable format"""
    if seconds < 60:
        return f"{seconds} сек"
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes} мин {secs} сек"


def format_distance(meters):
    """Format distance in meters to human readable format"""
    if meters >= 1000:
        return f"{meters/1000:.2f} км"
    return f"{meters:.0f} м"


def generate_report(data, output_path):
    """Generate PDF report from data"""
    styles = create_styles()
    story = []
    
    # Extract data
    report_type = data.get('type', 'delivery')
    user = data.get('user', {})
    results = data.get('results', [])
    stats = data.get('stats', {})
    period = data.get('period', {})
    
    # === COVER PAGE ===
    story.append(Spacer(1, 80))
    
    # Logo placeholder
    story.append(Paragraph(
        '<b>🤖 Robot Delivery Simulator</b>',
        styles['TitleRU']
    ))
    
    story.append(Spacer(1, 30))
    
    # Report title
    report_titles = {
        'delivery': 'Отчёт о доставках',
        'performance': 'Отчёт о производительности',
        'leaderboard': 'Рейтинг студентов',
        'analytics': 'Аналитический отчёт'
    }
    
    story.append(Paragraph(
        f'<b>{report_titles.get(report_type, "Отчёт")}</b>',
        styles['Heading1RU']
    ))
    
    story.append(Spacer(1, 20))
    
    # User info if provided
    if user:
        user_info = f"Пользователь: {user.get('name', 'N/A')}"
        if user.get('group'):
            user_info += f" | Группа: {user['group']}"
        story.append(Paragraph(user_info, styles['BodyRU']))
    
    # Period
    if period:
        story.append(Paragraph(
            f"Период: {period.get('start', 'N/A')} — {period.get('end', 'N/A')}",
            styles['BodyRU']
        ))
    
    # Generation date
    story.append(Paragraph(
        f"Дата генерации: {datetime.now().strftime('%d.%m.%Y %H:%M')}",
        styles['BodyRU']
    ))
    
    story.append(PageBreak())
    
    # === STATISTICS SECTION ===
    if stats:
        story.append(Paragraph('<b>Общая статистика</b>', styles['Heading1RU']))
        story.append(Spacer(1, 12))
        
        # Stats table
        stats_data = [
            [Paragraph('<b>Показатель</b>', styles['TableHeader']),
             Paragraph('<b>Значение</b>', styles['TableHeader'])]
        ]
        
        stats_mapping = {
            'totalDeliveries': ('Всего доставок', lambda x: str(x)),
            'successfulDeliveries': ('Успешных доставок', lambda x: str(x)),
            'successRate': ('Процент успеха', lambda x: f'{x:.1f}%'),
            'totalDistance': ('Общее расстояние', format_distance),
            'totalCollisions': ('Столкновений', lambda x: str(x)),
            'avgDuration': ('Среднее время', format_duration),
            'bestTime': ('Лучшее время', lambda x: format_duration(x) if x else 'N/A')
        }
        
        for key, (label, formatter) in stats_mapping.items():
            if key in stats and stats[key] is not None:
                stats_data.append([
                    Paragraph(label, styles['TableCell']),
                    Paragraph(formatter(stats[key]), styles['TableCell'])
                ])
        
        if len(stats_data) > 1:
            stats_table = Table(stats_data, colWidths=[200, 150])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'SimHei'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            story.append(stats_table)
            story.append(Paragraph('Таблица 1. Общая статистика', styles['Caption']))
    
    # === RESULTS TABLE ===
    if results:
        story.append(Paragraph('<b>Результаты доставок</b>', styles['Heading1RU']))
        story.append(Spacer(1, 12))
        
        # Results table
        results_data = [
            [Paragraph('<b>№</b>', styles['TableHeader']),
             Paragraph('<b>Сценарий</b>', styles['TableHeader']),
             Paragraph('<b>Статус</b>', styles['TableHeader']),
             Paragraph('<b>Расстояние</b>', styles['TableHeader']),
             Paragraph('<b>Время</b>', styles['TableHeader']),
             Paragraph('<b>Столкн.</b>', styles['TableHeader']),
             Paragraph('<b>Дата</b>', styles['TableHeader'])]
        ]
        
        for i, result in enumerate(results[:50], 1):  # Limit to 50 results
            status = '✓ Успех' if result.get('status') == 'success' else '✗ Ошибка'
            status_color = colors.HexColor('#28A745') if result.get('status') == 'success' else colors.HexColor('#DC3545')
            
            results_data.append([
                Paragraph(str(i), styles['TableCell']),
                Paragraph(result.get('scenarioName', 'N/A')[:20], styles['TableCell']),
                Paragraph(status, styles['TableCell']),
                Paragraph(format_distance(result.get('distance', 0)), styles['TableCell']),
                Paragraph(format_duration(result.get('duration', 0)), styles['TableCell']),
                Paragraph(str(result.get('collisions', 0)), styles['TableCell']),
                Paragraph(result.get('createdAt', 'N/A')[:10], styles['TableCell'])
            ])
        
        if len(results_data) > 1:
            results_table = Table(results_data, colWidths=[30, 100, 60, 70, 60, 50, 70])
            results_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'SimHei'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')])
            ]))
            story.append(results_table)
            story.append(Paragraph(f'Таблица 2. Результаты доставок (показано {min(len(results), 50)} из {len(results)})', styles['Caption']))
    
    # === FOOTER ===
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        'Отчёт сгенерирован автоматически системой Robot Delivery Simulator',
        styles['Caption']
    ))
    
    # Build PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title=f'Robot Simulator Report - {datetime.now().strftime("%Y-%m-%d")}',
        author='Z.ai',
        creator='Z.ai',
        subject='Robot Delivery Simulator Performance Report'
    )
    
    doc.build(story)
    print(f"PDF report generated: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Generate PDF report for Robot Delivery Simulator')
    parser.add_argument('-o', '--output', required=True, help='Output PDF file path')
    parser.add_argument('-d', '--data', required=True, help='JSON data file path')
    
    args = parser.parse_args()
    
    # Load data
    with open(args.data, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Generate report
    generate_report(data, args.output)


if __name__ == '__main__':
    main()
