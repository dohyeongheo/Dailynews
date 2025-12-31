#!/usr/bin/env node
/**
 * 로컬 환경 테스트 스크립트
 * 구현된 기능들이 올바르게 작동하는지 확인합니다.
 */

import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('=== 관리자 페이지 자동화 기능 로컬 테스트 ===\n');

const tests: Array<{ name: string; passed: boolean; error?: string }> = [];

// 1. 파일 존재 확인
function testFileExists() {
  console.log('1. 파일 존재 확인...');

  const files = [
    'lib/utils/browser-automation.ts',
    'scripts/admin/auto-access.ts',
    'scripts/admin/check-errors.ts',
    'app/api/admin/console-errors/route.ts',
    'app/api/admin/monitor/route.ts',
    'components/admin/ErrorMonitor.tsx',
    'docs/ADMIN_PAGE_AUTOMATION.md',
  ];

  let allExist = true;
  files.forEach((file) => {
    const exists = existsSync(join(process.cwd(), file));
    if (!exists) {
      console.log(`   ❌ ${file} - 파일 없음`);
      allExist = false;
    } else {
      console.log(`   ✅ ${file}`);
    }
  });

  tests.push({ name: '파일 존재 확인', passed: allExist });
  return allExist;
}

// 2. 컴포넌트 import 확인
function testComponentImports() {
  console.log('\n2. 컴포넌트 import 확인...');

  try {
    // Monitoring.tsx에서 ErrorMonitor를 import하는지 확인
    const monitoringPath = join(process.cwd(), 'components/admin/Monitoring.tsx');
    if (existsSync(monitoringPath)) {
      const fs = require('fs');
      const content = fs.readFileSync(monitoringPath, 'utf-8');
      if (content.includes('import ErrorMonitor') && content.includes('<ErrorMonitor')) {
        console.log('   ✅ ErrorMonitor가 Monitoring.tsx에 올바르게 통합됨');
        tests.push({ name: '컴포넌트 import 확인', passed: true });
        return true;
      } else {
        console.log('   ❌ ErrorMonitor가 Monitoring.tsx에 통합되지 않음');
        tests.push({ name: '컴포넌트 import 확인', passed: false });
        return false;
      }
    }
  } catch (error) {
    console.log(`   ❌ 컴포넌트 import 확인 실패: ${error}`);
    tests.push({ name: '컴포넌트 import 확인', passed: false, error: String(error) });
    return false;
  }
  return false;
}

// 3. package.json 스크립트 확인
function testPackageScripts() {
  console.log('\n3. package.json 스크립트 확인...');

  try {
    const packagePath = join(process.cwd(), 'package.json');
    if (existsSync(packagePath)) {
      const fs = require('fs');
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const scripts = content.scripts || {};

      const requiredScripts = [
        'admin:auto-access',
        'admin:check-errors',
      ];

      let allExist = true;
      requiredScripts.forEach((script) => {
        if (scripts[script]) {
          console.log(`   ✅ ${script}: ${scripts[script]}`);
        } else {
          console.log(`   ❌ ${script} - 스크립트 없음`);
          allExist = false;
        }
      });

      tests.push({ name: 'package.json 스크립트 확인', passed: allExist });
      return allExist;
    }
  } catch (error) {
    console.log(`   ❌ package.json 확인 실패: ${error}`);
    tests.push({ name: 'package.json 스크립트 확인', passed: false, error: String(error) });
    return false;
  }
  return false;
}

// 4. 타입 정의 확인
function testTypeDefinitions() {
  console.log('\n4. 타입 정의 확인...');

  try {
    const browserAutomationPath = join(process.cwd(), 'lib/utils/browser-automation.ts');
    if (existsSync(browserAutomationPath)) {
      const fs = require('fs');
      const content = fs.readFileSync(browserAutomationPath, 'utf-8');

      const requiredTypes = [
        'ConsoleMessage',
        'PageHealth',
        'AdminAccessResult',
      ];

      let allExist = true;
      requiredTypes.forEach((type) => {
        if (content.includes(`interface ${type}`) || content.includes(`type ${type}`)) {
          console.log(`   ✅ ${type} 타입 정의됨`);
        } else {
          console.log(`   ❌ ${type} - 타입 정의 없음`);
          allExist = false;
        }
      });

      tests.push({ name: '타입 정의 확인', passed: allExist });
      return allExist;
    }
  } catch (error) {
    console.log(`   ❌ 타입 정의 확인 실패: ${error}`);
    tests.push({ name: '타입 정의 확인', passed: false, error: String(error) });
    return false;
  }
  return false;
}

// 5. API 라우트 구조 확인
function testAPIRoutes() {
  console.log('\n5. API 라우트 구조 확인...');

  try {
    const consoleErrorsPath = join(process.cwd(), 'app/api/admin/console-errors/route.ts');
    const monitorPath = join(process.cwd(), 'app/api/admin/monitor/route.ts');

    if (existsSync(consoleErrorsPath) && existsSync(monitorPath)) {
      const fs = require('fs');
      const consoleErrorsContent = fs.readFileSync(consoleErrorsPath, 'utf-8');
      const monitorContent = fs.readFileSync(monitorPath, 'utf-8');

      const checks = [
        { name: 'console-errors GET', content: consoleErrorsContent, pattern: 'export const GET' },
        { name: 'console-errors POST', content: consoleErrorsContent, pattern: 'export const POST' },
        { name: 'monitor GET', content: monitorContent, pattern: 'export const GET' },
        { name: 'monitor POST', content: monitorContent, pattern: 'export const POST' },
      ];

      let allPass = true;
      checks.forEach((check) => {
        if (check.content.includes(check.pattern)) {
          console.log(`   ✅ ${check.name} 엔드포인트 정의됨`);
        } else {
          console.log(`   ❌ ${check.name} - 엔드포인트 없음`);
          allPass = false;
        }
      });

      tests.push({ name: 'API 라우트 구조 확인', passed: allPass });
      return allPass;
    }
  } catch (error) {
    console.log(`   ❌ API 라우트 확인 실패: ${error}`);
    tests.push({ name: 'API 라우트 구조 확인', passed: false, error: String(error) });
    return false;
  }
  return false;
}

// 메인 테스트 실행
async function main() {
  testFileExists();
  testComponentImports();
  testPackageScripts();
  testTypeDefinitions();
  testAPIRoutes();

  // 결과 요약
  console.log('\n=== 테스트 결과 요약 ===');
  const passed = tests.filter((t) => t.passed).length;
  const total = tests.length;

  tests.forEach((test) => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}${test.error ? ` (${test.error})` : ''}`);
  });

  console.log(`\n통과: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✅ 모든 테스트 통과!');
    console.log('\n다음 단계:');
    console.log('1. 개발 서버 실행: npm run dev');
    console.log('2. 브라우저에서 http://localhost:3000/admin 접속');
    console.log('3. Monitoring 탭에서 ErrorMonitor 컴포넌트 확인');
    console.log('4. CLI 테스트: npm run admin:check-errors help');
    process.exit(0);
  } else {
    console.log('\n❌ 일부 테스트 실패');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

