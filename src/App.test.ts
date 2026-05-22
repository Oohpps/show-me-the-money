import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

const { authenticateApp } = vi.hoisted(() => ({
  authenticateApp: vi.fn<() => Promise<boolean>>(),
}));

vi.mock('./native/biometric', () => ({
  authenticateApp,
}));

describe('App startup lock', () => {
  afterEach(() => {
    authenticateApp.mockReset();
  });

  it('shows the app only after biometric authentication succeeds', async () => {
    authenticateApp.mockResolvedValue(true);
    const wrapper = mount(App);

    expect(wrapper.text()).toContain('验证身份');
    expect(wrapper.findComponent({ name: 'AppShell' }).exists()).toBe(false);

    await flushPromises();

    expect(wrapper.findComponent({ name: 'AppShell' }).exists()).toBe(true);
    expect(wrapper.text()).not.toContain('验证身份');
  });

  it('keeps the lock screen available when authentication is cancelled', async () => {
    authenticateApp.mockResolvedValue(false);
    const wrapper = mount(App);

    await flushPromises();

    expect(wrapper.text()).toContain('验证身份');
    expect(wrapper.find('button').text()).toContain('重新验证');
    expect(wrapper.findComponent({ name: 'AppShell' }).exists()).toBe(false);
  });
});
