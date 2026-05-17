#!/usr/bin/env python3
"""
Fix script: Add ResumeExamModal JSX and missing key/initialAnswers props
to screens that were partially updated by the previous script.
"""
import re
import os

SCREENS_DIR = '/Users/mham/projects/german-telc-b1/app/GermanTelcB1App/src/screens/practice'

RESUME_MODAL_JSX = """\n      <ResumeExamModal
        visible={showResumeModal}
        savedProgress={savedProgress}
        onResume={() => {
          if (savedProgress?.answers?.length) {
            setResumedAnswers(savedProgress.answers);
            setUiKey(k => k + 1);
          }
          setShowResumeModal(false);
        }}
        onStartFresh={() => {
          setResumedAnswers(undefined);
          setUiKey(k => k + 1);
          setShowResumeModal(false);
        }}
      />"""

# Screens where the regex added key only to the first (DELE) UI component
SCREENS_TO_FIX = {
    'ReadingPart1Screen': {
        'non_dele_ui': 'ReadingPart1UI',
        'exam_type': 'reading-part1',
    },
    'ReadingPart2Screen': {
        'non_dele_ui': 'ReadingPart2UI',
        'exam_type': 'reading-part2',
    },
    'ReadingPart3Screen': {
        'non_dele_ui': 'ReadingPart3UI',
        'exam_type': 'reading-part3',
    },
    'ListeningPart1Screen': {
        'non_dele_ui': 'ListeningPart1UI',
        'exam_type': 'listening-part1',
    },
    'ListeningPart2Screen': {
        'non_dele_ui': 'ListeningPart2UI',
        'exam_type': 'listening-part2',
    },
    'ListeningPart3Screen': {
        'non_dele_ui': 'ListeningPart3UI',
        'exam_type': 'listening-part3',
    },
    # These only have DeleListeningUI so no second component issue
    'ListeningPart4Screen': {
        'non_dele_ui': None,
        'exam_type': 'listening-part4',
    },
    'ListeningPart5Screen': {
        'non_dele_ui': None,
        'exam_type': 'listening-part5',
    },
}

# All screens that need ResumeExamModal JSX added to render
ALL_SCREENS_NEEDING_MODAL_JSX = [
    'ReadingPart1Screen', 'ReadingPart1A1Screen', 'ReadingPart1A2Screen',
    'ReadingPart2Screen', 'ReadingPart2A1Screen', 'ReadingPart2A2Screen',
    'ReadingPart3Screen', 'ReadingPart3A1Screen', 'ReadingPart3A2Screen',
    'ListeningPart1Screen', 'ListeningPart1A1Screen', 'ListeningPart1A2Screen',
    'ListeningPart2Screen', 'ListeningPart2A1Screen', 'ListeningPart2A2Screen',
    'ListeningPart3Screen', 'ListeningPart3A1Screen', 'ListeningPart3A2Screen',
    'ListeningPart4Screen', 'ListeningPart5Screen',
    'WritingPart2Screen',
    'GrammarPart2Screen',  # Already done but double check
]

def fix_screen(screen_name):
    filepath = os.path.join(SCREENS_DIR, f'{screen_name}.tsx')
    if not os.path.exists(filepath):
        print(f"  SKIP: {screen_name}.tsx not found")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changed = False

    # 1. Add ResumeExamModal JSX to render if not present
    if 'visible={showResumeModal}' not in content and 'showResumeModal' in content:
        # Find "return (\n    <View..." and insert ResumeExamModal after opening View
        # Pattern: return (\n    <View style={styles.container}>
        match = re.search(r'(return \(\n\s+<View[^\n>]*>\n)', content)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + RESUME_MODAL_JSX + '\n' + content[insert_pos:]
            changed = True
            print(f"  + Added ResumeExamModal JSX to {screen_name}")
        else:
            print(f"  WARN: Could not find render position in {screen_name}")

    # 2. For screens with isDele branching, add key and initialAnswers to the non-DELE UI
    if screen_name in SCREENS_TO_FIX and SCREENS_TO_FIX[screen_name]['non_dele_ui']:
        non_dele_ui = SCREENS_TO_FIX[screen_name]['non_dele_ui']
        # Check if the non-DELE UI already has key={uiKey}
        # Find all occurrences of this UI component in JSX
        pattern = rf'(<{re.escape(non_dele_ui)}\b)'
        matches = list(re.finditer(pattern, content))
        for m in matches:
            # Check if this occurrence already has key={uiKey}
            # Look at the surrounding context (next 200 chars)
            context_start = m.start()
            context_end = min(m.end() + 200, len(content))
            context = content[context_start:context_end]
            if 'key={uiKey}' not in context:
                # Add key={uiKey} after the component name
                content = content[:m.end()] + ' key={uiKey}' + content[m.end():]
                changed = True
                print(f"  + Added key={{uiKey}} to {non_dele_ui} in {screen_name}")
                break

        # Check if initialAnswers={resumedAnswers} is on the non-DELE UI
        # Re-find after potential previous replacement
        matches = list(re.finditer(pattern, content))
        for m in matches:
            context_start = m.start()
            context_end = min(m.end() + 300, len(content))
            context = content[context_start:context_end]
            if 'initialAnswers={resumedAnswers}' not in context:
                # Find the end of this JSX element (before /> or >)
                rest = content[m.end():]
                close_match = re.search(r'\s*/>', rest)
                if close_match:
                    insert_pos = m.end() + close_match.start()
                    content = content[:insert_pos] + ' initialAnswers={resumedAnswers}' + content[insert_pos:]
                    changed = True
                    print(f"  + Added initialAnswers to {non_dele_ui} in {screen_name}")
                break

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK: {screen_name}")
    else:
        if 'visible={showResumeModal}' in content:
            print(f"  ALREADY OK: {screen_name}")
        else:
            print(f"  NO CHANGE: {screen_name}")

if __name__ == '__main__':
    print("Fixing screens with missing ResumeExamModal JSX and key props...")
    for screen_name in ALL_SCREENS_NEEDING_MODAL_JSX:
        fix_screen(screen_name)
    print("Done!")
