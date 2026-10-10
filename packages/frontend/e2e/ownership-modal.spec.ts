import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const openButton = (page: Page) =>
  page.getByRole('button', { name: 'Issue attestation' });

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/modal-harness.html');
  await page.waitForFunction(() => 'efrogTest' in window);
});

test('one in-flight issue opens a keyboard-contained native dialog and returns focus', async ({
  page,
}) => {
  await page.evaluate(() => {
    const trigger = document.querySelector<HTMLButtonElement>('.button');
    if (!trigger) throw new Error('Panel trigger is missing');
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  const dialog = page.getByRole('dialog', { name: 'Attestation status' });
  const close = dialog.getByRole('button', { name: 'Close modal' });
  const trigger = openButton(page);
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await expect(page.getByTestId('issue-count')).toHaveText('1');
  await expect(dialog.getByRole('status')).toHaveText(
    'User validation pending...',
  );
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();

  await page.evaluate(() => {
    window.efrogTest.complete('success');
  });
  await expect(page.getByTestId('issue-count')).toHaveText('1');
  await expect(
    dialog.getByRole('link', { name: /View attestation/ }),
  ).toHaveAttribute('href', /explorer\.ver\.ax\/linea\/attestations\//);
  await expect(
    dialog.getByRole('link', { name: /View transaction/ }),
  ).toHaveAttribute('href', /lineascan\.build\/tx\//);

  await page.keyboard.press('Tab');
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('keeps the dialog open for interior clicks and closes only from its backdrop', async ({
  page,
}) => {
  await openButton(page).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.modal').click();
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.efrogTest.complete('success'));

  await dialog.click({ position: { x: 2, y: 2 } });
  await expect(dialog).not.toBeVisible();
  await expect(openButton(page)).toBeFocused();
});

test('keeps result links on the originating chain and exposes error recovery', async ({
  page,
}) => {
  await openButton(page).click();
  await page.evaluate(() => {
    window.efrogTest.setIdentity(
      '0x2222222222222222222222222222222222222222',
      1,
    );
    window.efrogTest.complete('success');
  });
  await expect(page.getByRole('status').first()).toHaveText(
    'Switch to Linea to check eFrog ownership.',
  );
  await expect(openButton(page)).toBeDisabled();

  const dialog = page.getByRole('dialog', { name: 'Attestation status' });
  await expect(
    dialog.getByRole('link', { name: /View attestation/ }),
  ).toHaveAttribute('href', /explorer\.ver\.ax\/linea\/attestations\//);
  await dialog.getByRole('button', { name: 'Close modal' }).click();
  await expect(page.getByRole('main')).toBeFocused();
  await page.evaluate(() =>
    window.efrogTest.setIdentity(
      '0x1111111111111111111111111111111111111111',
      59144,
    ),
  );
  await expect(openButton(page)).toBeEnabled();

  await openButton(page).click();
  await page.evaluate(() => window.efrogTest.complete('error'));
  await expect(page.getByRole('alert')).toHaveText(
    'User denied transaction signature',
  );
  await page.getByRole('button', { name: 'Close modal' }).click();
  await expect(openButton(page)).toBeEnabled();
});

test('returns focus to a stable fallback when the trigger disappears during a pending operation', async ({
  page,
}) => {
  await openButton(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => window.efrogTest.hideTrigger(true));

  await page.getByRole('button', { name: 'Close modal' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
});

test('does not report unresolved/error balance as zero and retries a failed read', async ({
  page,
}) => {
  await page.evaluate(() => window.efrogTest.setBalance('loading'));
  await expect(page.getByRole('status').first()).toHaveText(
    'Checking eFrog ownership...',
  );
  await expect(openButton(page)).toBeDisabled();

  await page.evaluate(() => window.efrogTest.setBalance('0'));
  await expect(page.getByRole('status').first()).toHaveText(
    'You have 0 eFrogs',
  );
  await expect(openButton(page)).toBeDisabled();

  await page.evaluate(() => window.efrogTest.setBalance('error'));
  await expect(page.getByRole('status').first()).toHaveText(
    'Could not load eFrog balance. Retry.',
  );
  await expect(openButton(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Retry balance' }).last().click();
  await expect
    .poll(() => page.evaluate(() => window.efrogTest.retryCount()))
    .toBe(1);

  await page.evaluate(() => window.efrogTest.setBalance('2'));
  await expect(page.getByRole('status').first()).toHaveText(
    'You have 2 eFrogs',
  );
  await expect(openButton(page)).toBeEnabled();
});

test('fits long result links at 390px and 200% text zoom', async ({ page }) => {
  // A 195px CSS viewport models 200% browser zoom from a 390px phone viewport.
  await page.setViewportSize({ width: 195, height: 422 });
  await openButton(page).click();
  await page.evaluate(() => window.efrogTest.complete('success'));
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  const dialog = page.getByRole('dialog', { name: 'Attestation status' });
  await expect(dialog).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      }))
      .filter(({ right }) => right > document.documentElement.clientWidth + 1)
      .slice(0, 8),
  }));
  expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.viewport,
  );
  await expect(
    dialog.getByRole('link', { name: /View transaction/ }),
  ).toBeVisible();
});
