import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

interface Step { uses?: string; run?: string; with?: Record<string, string> }
interface Job { 'runs-on': string; needs?: string | string[]; if?: string; permissions?: Record<string, string>; steps?: Step[] }
const ci = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as {
  on: Record<string, unknown>; permissions: Record<string, string>; jobs: Record<string, Job>;
};
const { verify, deploy, lighthouse } = ci.jobs;

describe('CI and deploy workflow', () => {
  it('pins every job to a fixed runner image', () => {
    for (const job of Object.values(ci.jobs)) expect(job['runs-on']).toBe('ubuntu-24.04');
  });

  it('runs every gate, in order, before anything ships', () => {
    const runs = verify.steps!.flatMap((s) => (s.run ? [s.run] : []));
    expect(runs).toEqual(['npm ci', 'npm run validate', 'npm test', 'npm run check', 'npm run build', 'npm run check:site']);
  });

  it('takes the Node version from .nvmrc', () => {
    const node = verify.steps!.find((s) => s.uses?.startsWith('actions/setup-node@'));
    expect(node?.with?.['node-version-file']).toBe('.nvmrc');
  });

  it('runs Lighthouse on a fresh build and blocks deploy on it', () => {
    expect(lighthouse?.steps?.flatMap((s) => (s.run ? [s.run] : []))).toEqual(['npm ci', 'npm run build', 'npm run ci:lhci']);
    expect([deploy.needs].flat()).toContain('lighthouse');
  });

  it('deploys only after verify passes, and only from main', () => {
    expect([deploy.needs].flat()).toContain('verify');
    expect(deploy.if).toContain("github.ref == 'refs/heads/main'");
    expect(deploy.if).not.toContain('pull_request');
  });

  it('uploads the Pages artifact only on main, never from PRs', () => {
    const upload = verify.steps!.find((s) => s.uses?.startsWith('actions/upload-pages-artifact@')) as Step & { if?: string };
    expect(upload?.with?.path).toBe('dist');
    expect(upload?.if).toContain("github.ref == 'refs/heads/main'");
  });

  it('grants Pages write access to the deploy job alone', () => {
    expect(ci.permissions).toEqual({ contents: 'read' });
    expect(deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(verify.permissions).toBeUndefined();
  });

  it('has no second deploy workflow that could bypass the gates', () => {
    expect(existsSync('.github/workflows/deploy.yml')).toBe(false);
  });

  it('can still be redeployed by hand', () => {
    expect(ci.on).toHaveProperty('workflow_dispatch');
  });
});
