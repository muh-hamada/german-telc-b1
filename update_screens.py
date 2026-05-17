#!/usr/bin/env python3
"""
Script to add ResumeExamModal support to all exam screens.
For each screen, this script:
1. Adds ExamProgress to type imports
2. Adds ResumeExamModal import
3. Adds getExamProgress to useProgress() destructuring
4. Adds resume state variables
5. Adds progress check in loadExam after exam loads
6. Adds ResumeExamModal to render and key/initialAnswers props to UI components
"""

import re
import sys
import os

SCREENS_DIR = '/Users/mham/projects/german-telc-b1/app/GermanTelcB1App/src/screens/practice'

# Map of screen file -> (examType, [(UIComponent, castType or None)])
# UIComponent is the component name as used in JSX
SCREENS = {
    'ReadingPart1Screen': {
        'exam_type': 'reading-part1',
        'ui_components': [
            ('DeleReadingPart1UI', 'DeleReadingPart1Exam', True),  # (name, cast, is_dele)
            ('ReadingPart1UI', 'ReadingPart1Exam', False),
        ],
        'has_dele': True,
    },
    'ReadingPart1A1Screen': {
        'exam_type': 'reading-part1',
        'ui_components': [('ReadingPart1A1UI', None, False)],
        'has_dele': False,
    },
    'ReadingPart1A2Screen': {
        'exam_type': 'reading-part1',
        'ui_components': [('ReadingPart1A2UI', None, False)],
        'has_dele': False,
    },
    'ReadingPart2Screen': {
        'exam_type': 'reading-part2',
        'ui_components': [
            ('DeleReadingPart2UI', 'DeleReadingPart2Exam', True),
            ('ReadingPart2UI', 'ReadingPart2Exam', False),
        ],
        'has_dele': True,
    },
    'ReadingPart2A1Screen': {
        'exam_type': 'reading-part2',
        'ui_components': [('ReadingPart2A1UI', None, False)],
        'has_dele': False,
    },
    'ReadingPart2A2Screen': {
        'exam_type': 'reading-part2',
        'ui_components': [('ReadingPart2A2UI', None, False)],
        'has_dele': False,
    },
    'ReadingPart3Screen': {
        'exam_type': 'reading-part3',
        'ui_components': [
            ('DeleReadingPart3UI', 'DeleReadingPart3Exam', True),
            ('ReadingPart3UI', 'ReadingPart3Exam', False),
        ],
        'has_dele': True,
    },
    'ReadingPart3A1Screen': {
        'exam_type': 'reading-part3',
        'ui_components': [('ReadingPart3A1UI', None, False)],
        'has_dele': False,
    },
    'ReadingPart3A2Screen': {
        'exam_type': 'reading-part3',
        'ui_components': [('ReadingPart3A2UI', None, False)],
        'has_dele': False,
    },
    'ListeningPart1Screen': {
        'exam_type': 'listening-part1',
        'ui_components': [
            ('DeleListeningUI', None, True),
            ('ListeningPart1UI', None, False),
        ],
        'has_dele': True,
    },
    'ListeningPart1A1Screen': {
        'exam_type': 'listening-part1',
        'ui_components': [('ListeningPart1UIA1', None, False)],
        'has_dele': False,
    },
    'ListeningPart1A2Screen': {
        'exam_type': 'listening-part1',
        'ui_components': [('ListeningPart1A2UI', None, False)],
        'has_dele': False,
    },
    'ListeningPart2Screen': {
        'exam_type': 'listening-part2',
        'ui_components': [
            ('DeleListeningUI', None, True),
            ('ListeningPart2UI', None, False),
        ],
        'has_dele': True,
    },
    'ListeningPart2A1Screen': {
        'exam_type': 'listening-part2',
        'ui_components': [('ListeningPart2UIA1', None, False)],
        'has_dele': False,
    },
    'ListeningPart2A2Screen': {
        'exam_type': 'listening-part2',
        'ui_components': [('ListeningPart2A2UI', None, False)],
        'has_dele': False,
    },
    'ListeningPart3Screen': {
        'exam_type': 'listening-part3',
        'ui_components': [
            ('DeleListeningUI', None, True),
            ('ListeningPart3UI', None, False),
        ],
        'has_dele': True,
    },
    'ListeningPart3A1Screen': {
        'exam_type': 'listening-part3',
        'ui_components': [('ListeningPart3UIA1', None, False)],
        'has_dele': False,
    },
    'ListeningPart3A2Screen': {
        'exam_type': 'listening-part3',
        'ui_components': [('ListeningPart3A2UI', None, False)],
        'has_dele': False,
    },
    'ListeningPart4Screen': {
        'exam_type': 'listening-part4',
        'ui_components': [('DeleListeningUI', None, False)],
        'has_dele': False,
    },
    'ListeningPart5Screen': {
        'exam_type': 'listening-part5',
        'ui_components': [('DeleListeningUI', None, False)],
        'has_dele': False,
    },
    'WritingPart2Screen': {
        'exam_type': 'writing-part2',
        'ui_components': [('WritingPart2UIA1', None, False)],
        'has_dele': False,
    },
}

def already_updated(content):
    """Check if the screen is already updated."""
    return 'ResumeExamModal' in content or 'showResumeModal' in content

def add_exam_progress_import(content):
    """Add ExamProgress to the exam.types import."""
    # Pattern: import { ..., ExamResult } from '../../types/exam.types';
    # Add ExamProgress after ExamResult
    if 'ExamProgress' in content:
        return content  # Already there
    content = re.sub(
        r"(import \{[^}]*ExamResult)(\s*\})",
        r"\1, ExamProgress\2",
        content
    )
    return content

def add_resume_modal_import(content):
    """Add ResumeExamModal import."""
    if 'ResumeExamModal' in content:
        return content
    # Find the last import line and add after it
    # Find the import of ResultsModal or last UI import
    last_import_match = list(re.finditer(r"^import .+;$", content, re.MULTILINE))
    if not last_import_match:
        return content
    last_import = last_import_match[-1]
    insert_pos = last_import.end()
    return content[:insert_pos] + "\nimport ResumeExamModal from '../../components/ResumeExamModal';" + content[insert_pos:]

def add_get_exam_progress(content):
    """Add getExamProgress to useProgress() destructuring."""
    if 'getExamProgress' in content:
        return content
    content = re.sub(
        r'const \{ updateExamProgress \} = useProgress\(\);',
        'const { updateExamProgress, getExamProgress } = useProgress();',
        content
    )
    return content

def add_resume_state(content):
    """Add resume-related state variables."""
    if 'showResumeModal' in content:
        return content
    # Add after showReportIssueModal state
    resume_state = (
        "\n  const [uiKey, setUiKey] = useState(0);"
        "\n  const [resumedAnswers, setResumedAnswers] = useState<UserAnswer[] | undefined>(undefined);"
        "\n  const [showResumeModal, setShowResumeModal] = useState(false);"
        "\n  const [savedProgress, setSavedProgress] = useState<ExamProgress | null>(null);"
    )
    content = re.sub(
        r'(const \[showReportIssueModal, setShowReportIssueModal\] = useState\(false\);)',
        r'\1' + resume_state,
        content
    )
    return content

def add_progress_check(content, exam_type):
    """Add progress check in loadExam after exam is set."""
    if 'getExamProgress(' in content:
        return content
    progress_check = (
        f"\n        // Check for saved progress from previous attempt"
        f"\n        const progress = getExamProgress('{exam_type}', String(id));"
        f"\n        if (progress?.answers && progress.answers.length > 0) {{"
        f"\n          setSavedProgress(progress);"
        f"\n          setShowResumeModal(true);"
        f"\n        }}"
    )
    # Find the pattern: setCurrentExam(exam); ... setExamResult(null);
    # and add the progress check after setExamResult(null);
    pattern = r'(setExamResult\(null\);)'
    
    # Only modify inside the if (exam) block - find setExamResult(null) in the loadExam context
    content = re.sub(
        r'(setExamResult\(null\);)(\s*\n)',
        r'\1' + progress_check + r'\2',
        content,
        count=1  # Only replace first occurrence (in loadExam)
    )
    return content

RESUME_MODAL_JSX = """      <ResumeExamModal
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

def add_resume_modal_to_render(content, ui_components, has_dele):
    """Add ResumeExamModal before UI components and add key/initialAnswers props."""
    if 'showResumeModal' in content and 'ResumeExamModal' in content and 'key={uiKey}' in content:
        return content  # Already fully updated
    
    # Add key and initialAnswers to each UI component
    for (ui_name, cast_type, is_dele) in ui_components:
        # Match the JSX element: <UIName or <UIName\n
        # Add key={uiKey} and initialAnswers={resumedAnswers} if not already there
        if f'key={{uiKey}}' not in content:
            # Match JSX self-closing or opening tag for this UI component
            # Pattern: <UIName (possibly with cast) exam={...} or just <UIName\n
            content = re.sub(
                rf'<{re.escape(ui_name)}(\s+)',
                rf'<{ui_name} key={{uiKey}}\1',
                content
            )
        if f'initialAnswers={{resumedAnswers}}' not in content:
            content = re.sub(
                rf'(<{re.escape(ui_name)}[^/]*?)(\s*/?>)',
                rf'\1 initialAnswers={{resumedAnswers}}\2',
                content
            )
    
    # Add ResumeExamModal before the first UI component in render
    # Find: return (\n    <View style={styles.container}>
    if 'ResumeExamModal' not in content:
        content = re.sub(
            r'(return \(\n\s+<View[^>]+>\n)',
            r'\1' + RESUME_MODAL_JSX + '\n',
            content,
            count=1
        )
    
    return content

def process_screen(screen_name, config):
    filepath = os.path.join(SCREENS_DIR, f'{screen_name}.tsx')
    if not os.path.exists(filepath):
        print(f"  SKIP: {screen_name}.tsx not found")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if already_updated(content):
        print(f"  SKIP: {screen_name} already updated")
        return
    
    original = content
    
    content = add_exam_progress_import(content)
    content = add_resume_modal_import(content)
    content = add_get_exam_progress(content)
    content = add_resume_state(content)
    content = add_progress_check(content, config['exam_type'])
    content = add_resume_modal_to_render(content, config['ui_components'], config['has_dele'])
    
    if content == original:
        print(f"  WARN: {screen_name} - no changes made")
        return
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  OK: {screen_name}")

if __name__ == '__main__':
    print("Updating exam screens with ResumeExamModal support...")
    for screen_name, config in SCREENS.items():
        process_screen(screen_name, config)
    print("Done!")
