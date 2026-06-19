import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SectionMenuScreen from '../SectionMenuScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { sectionId: 'reading' } }),
}));

// Mock translation
jest.mock('../../../hooks/useCustomTranslation', () => ({
  useCustomTranslation: () => ({ t: (key: string) => key }),
}));

// Mock theme
jest.mock('../../../contexts/ThemeContext', () => ({
  useAppTheme: () => ({
    colors: {
      background: { primary: '#fff', secondary: '#f5f5f5' },
      text: { primary: '#000', secondary: '#666' },
      border: { separator: '#ddd' },
    },
    typography: {
      textStyles: {
        h3: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 14 },
      },
    },
  }),
}));

// Mock data service
const mockGetReadingPart1Exams = jest.fn(() => Promise.resolve([
  { id: '1', title: 'Exam 1' },
  { id: '2', title: 'Exam 2' },
]));
const mockGetReadingPart2Exams = jest.fn(() => Promise.resolve([
  { id: '3', title: 'Exam 3' },
]));

jest.mock('../../../services/data.service', () => ({
  dataService: {
    getReadingPart1Exams: () => mockGetReadingPart1Exams(),
    getReadingPart2Exams: () => mockGetReadingPart2Exams(),
  },
}));

// Mock analytics
jest.mock('../../../services/analytics.events', () => ({
  AnalyticsEvents: {
    PRACTICE_SECTION_OPENED: 'practice_section_opened',
    EXAM_SELECTION_OPENED: 'exam_selection_opened',
    PRACTICE_EXAM_OPENED: 'practice_exam_opened',
  },
  logEvent: jest.fn(),
}));

// Mock components
jest.mock('../../../components/SectionStatsCard', () => {
  const { View, Text } = require('react-native');
  return ({ section, sectionLabel }: any) => (
    <View testID="section-stats-card">
      <Text>{sectionLabel}</Text>
    </View>
  );
});

jest.mock('../../../components/CardsListSeperator', () => {
  const { View, Text } = require('react-native');
  return ({ title }: any) => (
    <View testID="separator">
      <Text>{title}</Text>
    </View>
  );
});

jest.mock('../../../components/ExamSelectionModal', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ visible, onSelectExam, title, exams }: any) => {
    if (!visible) return null;
    return (
      <View testID="exam-modal">
        <Text>{title}</Text>
        {exams.map((exam: any) => (
          <TouchableOpacity
            key={exam.id}
            testID={`exam-option-${exam.id}`}
            onPress={() => onSelectExam(exam.id)}
          >
            <Text>{exam.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
});

// Mock active exam config
jest.mock('../../../config/active-exam.config', () => ({
  activeExamConfig: {
    sections: [
      {
        id: 'reading',
        order: 1,
        enabled: true,
        menuTitleKey: 'practice.reading.title',
        menuDescriptionKey: 'practice.reading.description',
        menuBehavior: 'submenu',
        parts: [
          {
            id: 'reading-1',
            partNumber: 1,
            screenKey: 'ReadingPart1',
            uiComponentKey: 'ReadingPart1UI',
            wrapperKey: 'ReadingPart1Wrapper',
            titleKey: 'practice.reading.part1',
            descriptionKey: 'practice.reading.descriptions.part1',
            navTitleKey: 'nav.practice.reading.part1',
            dataLoader: { listMethod: 'getReadingPart1Exams', fetchMethod: 'getReadingPart1ExamById' },
            maxPoints: 25,
            timeMinutes: 30,
            scoringGroup: 'written',
            mockExamSectionName: 'Leseverstehen',
            mockExamPartName: 'Teil 1',
            mockExamSectionNumber: 1,
            hasExamSelection: true,
          },
          {
            id: 'reading-2',
            partNumber: 2,
            screenKey: 'ReadingPart2',
            uiComponentKey: 'ReadingPart2UI',
            wrapperKey: 'ReadingPart2Wrapper',
            titleKey: 'practice.reading.part2',
            descriptionKey: 'practice.reading.descriptions.part2',
            navTitleKey: 'nav.practice.reading.part2',
            dataLoader: { listMethod: 'getReadingPart2Exams', fetchMethod: 'getReadingPart2ExamById' },
            maxPoints: 25,
            timeMinutes: 30,
            scoringGroup: 'written',
            mockExamSectionName: 'Leseverstehen',
            mockExamPartName: 'Teil 2',
            mockExamSectionNumber: 1,
            hasExamSelection: true,
          },
          {
            id: 'reading-3',
            partNumber: 3,
            screenKey: 'ReadingPart3',
            uiComponentKey: 'ReadingPart3UI',
            wrapperKey: 'ReadingPart3Wrapper',
            titleKey: 'practice.reading.part3',
            descriptionKey: 'practice.reading.descriptions.part3',
            navTitleKey: 'nav.practice.reading.part3',
            dataLoader: { listMethod: 'getReadingPart3Exams', fetchMethod: 'getReadingPart3ExamById' },
            maxPoints: 25,
            timeMinutes: 30,
            scoringGroup: 'written',
            mockExamSectionName: 'Leseverstehen',
            mockExamPartName: 'Teil 3',
            mockExamSectionNumber: 1,
            hasExamSelection: false,
          },
        ],
        extraMenuItems: [
          {
            id: 'vocabulary',
            screenKey: 'VocabularyBuilder',
            titleKey: 'practice.reading.vocabulary',
            descriptionKey: 'practice.reading.vocabulary.desc',
          },
        ],
      },
    ],
  },
}));

describe('SectionMenuScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section parts as cards', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.part1')).toBeTruthy();
      expect(screen.getByText('practice.reading.part2')).toBeTruthy();
      expect(screen.getByText('practice.reading.part3')).toBeTruthy();
    });
  });

  it('renders extra menu items', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.vocabulary')).toBeTruthy();
    });
  });

  it('opens exam selection modal on part with hasExamSelection=true', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.part1')).toBeTruthy();
    });

    // Modal should not be visible initially
    expect(screen.queryByTestId('exam-modal')).toBeNull();

    // Press reading part 1 (has exam selection)
    fireEvent.press(screen.getByText('practice.reading.part1'));

    await waitFor(() => {
      expect(screen.queryByTestId('exam-modal')).toBeTruthy();
    });
  });

  it('navigates directly for part without exam selection', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.part3')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('practice.reading.part3'));

    expect(mockNavigate).toHaveBeenCalledWith('ReadingPart3');
  });

  it('navigates with examId when exam is selected from modal', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.part1')).toBeTruthy();
    });

    // Open modal for part 1
    fireEvent.press(screen.getByText('practice.reading.part1'));

    await waitFor(() => {
      expect(screen.getByTestId('exam-modal')).toBeTruthy();
    });

    // Select exam from modal
    fireEvent.press(screen.getByTestId('exam-option-1'));

    expect(mockNavigate).toHaveBeenCalledWith('ReadingPart1', { examId: '1' });
  });

  it('navigates to extra menu item screen', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.vocabulary')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('practice.reading.vocabulary'));

    expect(mockNavigate).toHaveBeenCalledWith('VocabularyBuilder');
  });

  it('loads exam data for parts with hasExamSelection', async () => {
    render(<SectionMenuScreen />);

    await waitFor(() => {
      expect(mockGetReadingPart1Exams).toHaveBeenCalled();
      expect(mockGetReadingPart2Exams).toHaveBeenCalled();
    });
  });
});
