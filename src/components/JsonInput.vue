<script setup lang="ts">
import { ref } from 'vue'

const jsonInput = ref('')
const sortModules = ref(true)
const error = ref('')

const emit = defineEmits<{
  submit: [value: string, sort: boolean]
}>()

const handleSubmit = () => {
  if (!jsonInput.value.trim()) return
  emit('submit', jsonInput.value, sortModules.value)
}

const handleTextareaInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  jsonInput.value = target.value
}
</script>

<template>
  <div class="json-input">
    <h2>Paste your JSON configuration</h2>
    <textarea
      :value="jsonInput"
      rows="20"
      placeholder="Paste your JSON here..."
      @input="handleTextareaInput"
    />
    <div v-if="error" class="error">{{ error }}</div>
    <div class="input-controls">
      <button type="button" @click="handleSubmit">Load Configuration</button>
      <label class="sort-checkbox">
        <input type="checkbox" v-model="sortModules">
        Sort modules
      </label>
    </div>
  </div>
</template>

<style scoped>
.json-input {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.json-input textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  min-height: 500px;
  box-sizing: border-box;
  text-align: left;
  background: var(--surface-card);
  color: var(--text-primary);
}

.error {
  color: var(--error-text);
  margin-bottom: 10px;
}

button {
  width: fit-content;
  padding: 10px 20px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

button:hover {
  background: var(--primary-hover);
}

h2 {
  color: var(--text-inverse);
  margin-bottom: 30px;
  font-size: 22px;
  font-weight: 600;
}

.input-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.sort-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-inverse);
  cursor: pointer;
  user-select: none;
}

.sort-checkbox input {
  cursor: pointer;
}

.spacer {
  flex: 1;
}
</style>
