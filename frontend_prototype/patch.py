import re

with open('app/resident/map/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the content between {/* 1. HERO SECTION */} and {/* Persistent Ask AI Floating Button */}
# but leave the footer if it's there. Wait, where is the footer in app/resident/page.tsx?
