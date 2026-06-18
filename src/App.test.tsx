import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { StoreProvider } from './store';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderApp() {
  return render(
    <StoreProvider>
      <App />
    </StoreProvider>,
  );
}

test('mounts on the dashboard with seeded stats and up-next list', () => {
  renderApp();
  expect(screen.getByText('VideoFlow')).toBeTruthy();
  expect(screen.getByText('In production')).toBeTruthy();
  expect(screen.getAllByText('How I Plan 30 Videos in a Weekend').length).toBeGreaterThan(0);
});

test('dashboard shows the incomplete-checklists section with seeded items', () => {
  renderApp();
  expect(screen.getByText('Incomplete checklists')).toBeTruthy();
  expect(screen.getByText('unchecked tasks in the current stage')).toBeTruthy();
  // seed videos all start with empty checklists, so a 0/3-style counter renders
  expect(screen.getAllByText(/^\d+\/\d+$/).length).toBeGreaterThan(0);
});

test('navigates to the pipeline and shows the video count', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /Pipeline/ }));
  expect(screen.getByText('Drag cards across stages to update status')).toBeTruthy();
  expect(screen.getByText(/\d+ videos/)).toBeTruthy();
});

test('opening a card reveals the detail drawer and stage can advance', () => {
  renderApp();
  fireEvent.click(screen.getAllByText('How I Plan 30 Videos in a Weekend')[0]);
  expect(screen.getByText('Workflow stage')).toBeTruthy();
  expect(screen.getByText('Rough cut')).toBeTruthy(); // editing-stage checklist item
  fireEvent.click(screen.getByText(/Move to Review/));
  expect(screen.getByText(/Move to Publishing/)).toBeTruthy();
});

test('a video can be deleted from the detail drawer', () => {
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /Ideas/ })); // v4 lives in Ideas
  fireEvent.click(screen.getAllByText('My 2026 Studio Tour')[0]);
  fireEvent.click(screen.getByText('Delete video'));
  expect(screen.queryByText('My 2026 Studio Tour')).toBeNull();
  confirmSpy.mockRestore();
});

test('the posting date can be edited', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /Ideas/ }));
  // open v4 "My 2026 Studio Tour" which is seeded with publish 2026-07-15
  fireEvent.click(screen.getAllByText('My 2026 Studio Tour')[0]);
  const dateInput = screen.getByDisplayValue('2026-07-15') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: '2026-08-01' } });
  expect((screen.getByDisplayValue('2026-08-01') as HTMLInputElement).value).toBe('2026-08-01');
});

test('capturing an idea adds it to the Ideas view', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /Ideas/ }));
  const inputBox = screen.getByPlaceholderText('Capture a new idea and press Enter…');
  fireEvent.change(inputBox, { target: { value: 'A brand new test idea' } });
  fireEvent.click(screen.getByText('Add idea'));
  expect(screen.getByText('A brand new test idea')).toBeTruthy();
  expect(screen.getAllByText(/Start scripting/).length).toBeGreaterThan(0);
});

test('new video modal creates a video and lands on the pipeline', () => {
  renderApp();
  fireEvent.click(screen.getByText('New video'));
  const titleInput = screen.getByPlaceholderText('e.g. How I edit a video in 20 minutes');
  fireEvent.change(titleInput, { target: { value: 'My freshly created video' } });
  fireEvent.click(screen.getByText('Create video'));
  expect(screen.getByText('My freshly created video')).toBeTruthy();
  expect(screen.getByText('Drag cards across stages to update status')).toBeTruthy();
});
