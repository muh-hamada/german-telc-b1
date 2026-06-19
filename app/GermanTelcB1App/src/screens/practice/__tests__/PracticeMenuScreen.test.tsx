import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PracticeMenuScreen from '../PracticeMenuScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
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
jest.mock('../../../services/data.service', () => ({
  dataService: {
    getWritingExams: jest.fn(() => Promise.resolve([{ id: 'w1', title: 'Writing 1' }])),
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

// Mock Card component
jest.mock('../../../components/Card', () => {
  const { TouchableOpacity, View } = require('react-native');
  return ({ children, onPress, style }: any) => (
    <TouchableOpacity onPress={onPress} style={style}>
      <View>{children}</View>
    </TouchableOpacity>
  );
});

// Mock ExamSelectionModal
jest.mock('../../../components/ExamSelectionModal', () => {
  const { View, Text } = require('react-native');
  return ({ visible, title }: any) => {
    if (!visible) return null;
    return (
      <View testID="writing-modal">
        <Text>{title}</Text>
      </View>
    );
  };
});

// Mock active exam config - config-driven path (with sections)
jest.mock('../../../config/active-exam.config', () => ({
  activeExamConfig: {
    id: 'german-b1',
    language: 'german',
    level: 'B1',
    provider: 'telc',
    sections: [
      {
        id: 'reading',
        order: 1,
        enabled: true,
        menuTitleKey: 'practice.reading.title',
        menuDescriptionKey: 'practice.reading.description',
        menuBehavior: 'submenu',
        parts: [],
      },
      {
        id: 'listening',
        order: 2,
        enabled: true,
        menuTitleKey: 'practice.listening.title',
        menuDescriptionKey: 'practice.listening.description',
        menuBehavior: 'submenu',
        parts: [],
      },
      {
        id: 'grammar',
        order: 3,
        enabled: true,
        menuTitleKey: 'practice.grammar.title',
        menuDescriptionKey: 'practice.grammar.description',
        menuBehavior: 'submenu',
        parts: [],
      },
      {
        id: 'writing',
        order: 4,
        enabled: true,
        menuTitleKey: 'practice.writing.title',
        menuDescriptionKey: 'practice.writing.description',
        menuBehavior: 'modal',
        parts: [
          {
            id: 'writing-1',
            partNumber: 1,
            screenKey: 'Writing',
            titleKey: 'practice.writing.part1',
            descriptionKey: 'practice.writing.descriptions.part1',
            navTitleKey: 'nav.practice.writing.part1',
            dataLoader: { listMethod: 'getWritingExams', fetchMethod: 'getWritingExamById' },
            maxPoints: 45,
            hasExamSelection: true,
          },
        ],
      },
      {
        id: 'speaking',
        order: 5,
        enabled: true,
        menuTitleKey: 'practice.speaking.title',
        menuDescriptionKey: 'practice.speaking.description',
        menuBehavior: 'submenu',
        parts: [],
      },
    ],
  },
}));

describe('PracticeMenuScreen - config-driven', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all enabled sections from config', async () => {
    render(<PracticeMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.title')).toBeTruthy();
      expect(screen.getByText('practice.listening.title')).toBeTruthy();
      expect(screen.getByText('practice.grammar.title')).toBeTruthy();
      expect(screen.getByText('practice.writing.title')).toBeTruthy();
      expect(screen.getByText('practice.speaking.title')).toBeTruthy();
    });
  });

  it('navigates to SectionMenu for submenu-type sections', async () => {
    render(<PracticeMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.reading.title')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('practice.reading.title'));

    expect(mockNavigate).toHaveBeenCalledWith('SectionMenu', { sectionId: 'reading' });
  });

  it('opens writing modal for modal-type section', async () => {
    render(<PracticeMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.writing.title')).toBeTruthy();
    });

    // Modal not visible initially
    expect(screen.queryByTestId('writing-modal')).toBeNull();

    fireEvent.press(screen.getByText('practice.writing.title'));

    await waitFor(() => {
      expect(screen.queryByTestId('writing-modal')).toBeTruthy();
    });
  });

  it('navigates to SectionMenu for speaking', async () => {
    render(<PracticeMenuScreen />);

    await waitFor(() => {
      expect(screen.getByText('practice.speaking.title')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('practice.speaking.title'));

    expect(mockNavigate).toHaveBeenCalledWith('SectionMenu', { sectionId: 'speaking' });
  });
});
