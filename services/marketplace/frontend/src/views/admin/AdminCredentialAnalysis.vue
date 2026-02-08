<template>
  <div class="admin-credential-analysis">
    <div class="section-header">
      <h2 class="section-title">Transcript skills analysis</h2>
      <div class="header-actions">
        <button
          type="button"
          class="analyze-btn"
          :disabled="analyzing || courses.length === 0"
          @click="analyze"
        >
          <i :class="analyzing ? 'pi pi-spin pi-spinner' : 'pi pi-chart-line'"></i>
          {{ analyzing ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <p class="section-desc">
      Enter a list of courses (title + code) to analyze transcript skills. Uses the
      <a
        href="https://github.com/DigiCred-Holdings/transcript-skills-analysis"
        target="_blank"
        rel="noopener noreferrer"
      >transcript-skills-analysis</a>
      lambda: matches courses against the skills registry and returns skills of interest, pathways, and a summary.
    </p>

    <div class="form-panel">
      <h3>Courses list</h3>
      <p class="hint">Add courses as [title, code] pairs. Codes are matched against the skills registry.</p>

      <div class="courses-table">
        <div class="courses-header">
          <span class="col-title">Course title</span>
          <span class="col-code">Code</span>
          <span class="col-actions"></span>
        </div>
        <div
          v-for="(c, i) in courses"
          :key="i"
          class="course-row"
        >
          <input
            v-model="c[0]"
            type="text"
            placeholder="e.g. English 12"
            class="input-title"
          />
          <input
            v-model="c[1]"
            type="text"
            placeholder="e.g. ENG12"
            class="input-code"
          />
          <button
            type="button"
            class="btn-remove"
            title="Remove"
            @click="removeCourse(i)"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <div class="form-actions-top">
        <button
          type="button"
          class="btn-add"
          @click="addCourse"
        >
          <i class="pi pi-plus"></i>
          Add course
        </button>
        <div class="paste-area">
          <label for="paste-json">Or paste JSON:</label>
          <input
            id="paste-json"
            v-model="pasteJson"
            type="text"
            placeholder='[["English 12","ENG12"],["Math 12","MATH12"]]'
            class="input-paste"
          />
          <button
            type="button"
            class="btn-paste"
            :disabled="!pasteJson.trim()"
            @click="applyPaste"
          >
            Apply
          </button>
        </div>
      </div>

      <p v-if="analysisError" class="form-error">{{ analysisError }}</p>
    </div>

    <div
      v-if="result"
      class="results-panel"
    >
      <h3>Results</h3>

      <div class="summary-block">
        <p class="summary-text">{{ result.summary }}</p>
        <p class="meta">
          {{ result.count }} skills · {{ result.course_ids?.length ?? 0 }} courses analyzed
        </p>
      </div>

      <div
        v-if="result.skill_level_counts?.length"
        class="skill-levels"
      >
        <h4>Skill levels</h4>
        <div class="level-bars">
          <div
            v-for="(n, i) in result.skill_level_counts"
            :key="i"
            class="level-bar"
          >
            <span class="level-label">Level {{ i + 1 }}</span>
            <div
              class="level-fill"
              :style="{ width: levelWidth(n) + '%' }"
            />
            <span class="level-count">{{ n }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="result.skills_of_interest?.length"
        class="skills-of-interest"
      >
        <h4>Skills of interest</h4>
        <div
          v-for="(skill, idx) in result.skills_of_interest"
          :key="idx"
          class="skill-card"
        >
          <div class="skill-header">
            <span class="skill-name">{{ skill.name }}</span>
            <span v-if="skill.category" class="skill-category">{{ skill.category }}</span>
            <span v-if="skill.count != null" class="skill-count">×{{ skill.count }}</span>
          </div>
          <p
            v-if="skill.pathways"
            class="skill-pathways"
          >
            {{ skill.pathways }}
          </p>
        </div>
      </div>

      <div
        v-if="result.course_ids?.length"
        class="course-ids"
      >
        <h4>Analyzed course codes</h4>
        <code class="course-ids-list">{{ result.course_ids.join(', ') }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as adminApi from '@/api/admin';

type CourseEntry = [string, string];

const courses = ref<CourseEntry[]>([['', ''], ['', '']]);
const pasteJson = ref('');
const analyzing = ref(false);
const analysisError = ref('');
const result = ref<adminApi.TranscriptSkillsAnalysisResponse | null>(null);

function addCourse() {
  courses.value.push(['', '']);
}

function removeCourse(i: number) {
  courses.value.splice(i, 1);
}

function applyPaste() {
  try {
    const parsed = JSON.parse(pasteJson.value) as unknown;
    if (!Array.isArray(parsed)) {
      analysisError.value = 'JSON must be an array of [title, code] pairs';
      return;
    }
    const valid: CourseEntry[] = [];
    for (const item of parsed) {
      if (Array.isArray(item) && item.length >= 2 && typeof item[0] === 'string' && typeof item[1] === 'string') {
        valid.push([item[0], item[1]]);
      }
    }
    if (valid.length === 0) {
      analysisError.value = 'No valid [title, code] pairs found. Format: [["English 12","ENG12"],["Math 12","MATH12"]]';
      return;
    }
    courses.value = valid;
    pasteJson.value = '';
    analysisError.value = '';
  } catch {
    analysisError.value = 'Invalid JSON. Use format: [["title","code"],["title2","code2"]]';
  }
}

function levelWidth(n: number): number {
  const counts = result.value?.skill_level_counts ?? [0, 0, 0];
  const max = Math.max(1, ...counts);
  return (n / max) * 100;
}

async function analyze() {
  const entries = courses.value
    .filter((c) => c[0]?.trim() && c[1]?.trim())
    .map((c) => [c[0].trim(), c[1].trim()] as CourseEntry);
  if (entries.length === 0) {
    analysisError.value = 'Add at least one course with title and code.';
    return;
  }
  analyzing.value = true;
  analysisError.value = '';
  result.value = null;
  try {
    const data = await adminApi.analyzeTranscriptSkills(entries);
    result.value = data;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: { error?: string }; status?: number } };
    analysisError.value = ax?.response?.data?.error ?? 'Failed to analyze transcript skills';
  } finally {
    analyzing.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-credential-analysis {
  overflow-x: hidden;

  .section-desc {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0 0 20px 0;
    line-height: 1.5;

    a {
      color: $marketplace-link;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .analyze-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: $marketplace-primary;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .form-panel,
  .results-panel {
    margin-top: 20px;
    padding: 24px 28px;
    background: $marketplace-bg-card;
    border: 1px solid rgba($marketplace-primary, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    max-width: 720px;
  }

  .form-panel h3,
  .results-panel h3 {
    font-size: 0.95rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  .results-panel h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: $marketplace-text;
    margin: 24px 0 12px 0;

    &:first-of-type {
      margin-top: 0;
    }
  }

  .hint {
    font-size: 0.8rem;
    color: $marketplace-text-muted;
    margin: 0 0 16px 0;
    line-height: 1.4;
  }

  .courses-table {
    margin-bottom: 16px;
  }

  .courses-header {
    display: grid;
    grid-template-columns: 1fr 120px 40px;
    gap: 12px;
    padding: 0 0 8px 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: $marketplace-text-muted;
    border-bottom: 1px solid $marketplace-panel-border;
  }

  .course-row {
    display: grid;
    grid-template-columns: 1fr 120px 40px;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba($marketplace-panel-border, 0.5);

    &:last-child {
      border-bottom: none;
    }
  }

  .input-title,
  .input-code {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: rgba($marketplace-primary, 0.4);
    }
  }

  .input-code {
    font-family: ui-monospace, monospace;
  }

  .btn-remove {
    padding: 8px;
    border: none;
    background: transparent;
    color: $marketplace-text-muted;
    cursor: pointer;
    border-radius: 6px;

    &:hover {
      background: rgba($marketplace-danger, 0.1);
      color: $marketplace-danger;
    }
  }

  .form-actions-top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px 24px;
  }

  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    background: white;
    color: $marketplace-primary;
    cursor: pointer;

    &:hover {
      background: rgba($marketplace-primary, 0.06);
      border-color: rgba($marketplace-primary, 0.3);
    }
  }

  .paste-area {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-size: 0.85rem;
      color: $marketplace-text-muted;
      white-space: nowrap;
    }

    .input-paste {
      flex: 1;
      min-width: 0;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.85rem;
      font-family: ui-monospace, monospace;

      &:focus {
        outline: none;
        border-color: rgba($marketplace-primary, 0.4);
      }
    }

    .btn-paste {
      padding: 8px 12px;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 8px;
      border: 1px solid $marketplace-panel-border;
      background: white;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: rgba($marketplace-primary, 0.06);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .form-error {
    font-size: 0.9rem;
    color: $marketplace-danger;
    margin: 16px 0 0 0;
  }

  .results-panel {
    margin-top: 24px;
  }

  .summary-block {
    margin-top: 16px;
  }

  .summary-text {
    font-size: 1rem;
    line-height: 1.6;
    color: $marketplace-text;
    margin: 0 0 12px 0;
  }

  .meta {
    font-size: 0.85rem;
    color: $marketplace-text-muted;
    margin: 0;
  }

  .level-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .level-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    height: 24px;
  }

  .level-label {
    width: 60px;
    font-size: 0.85rem;
    color: $marketplace-text-muted;
  }

  .level-fill {
    flex: 1;
    height: 12px;
    background: rgba($marketplace-primary, 0.25);
    border-radius: 6px;
    min-width: 4px;
    transition: width 0.3s;
  }

  .level-count {
    width: 24px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $marketplace-text;
    text-align: right;
  }

  .skill-card {
    padding: 16px 18px;
    background: rgba($marketplace-primary, 0.04);
    border: 1px solid rgba($marketplace-panel-border, 0.8);
    border-radius: 10px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .skill-header {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .skill-name {
    font-weight: 600;
    font-size: 1rem;
    color: $marketplace-primary;
  }

  .skill-category {
    font-size: 0.8rem;
    padding: 2px 8px;
    background: rgba($marketplace-primary, 0.1);
    color: $marketplace-text-muted;
    border-radius: 6px;
  }

  .skill-count {
    font-size: 0.8rem;
    color: $marketplace-text-muted;
  }

  .skill-pathways {
    font-size: 0.9rem;
    line-height: 1.5;
    color: $marketplace-text;
    margin: 0;
  }

  .course-ids {
    margin-top: 20px;
  }

  .course-ids-list {
    display: block;
    padding: 12px 16px;
    background: rgba(0, 51, 102, 0.05);
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    font-size: 0.85rem;
    font-family: ui-monospace, monospace;
    word-break: break-all;
  }
}
</style>
