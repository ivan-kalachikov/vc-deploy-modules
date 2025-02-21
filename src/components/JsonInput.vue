<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  error: string
}>()

const jsonInput = ref('')
const sortModules = ref(true)

const emit = defineEmits<{
  submit: [value: string, sort: boolean]
}>()

const handleSubmit = () => {
  if (!jsonInput.value.trim()) return
  emit('submit', jsonInput.value, sortModules.value)
}
</script>

<template>
  <div class="json-input">
    <h2>Paste your JSON configuration</h2>
    <textarea
      v-model="jsonInput"
      rows="20"
      placeholder="Paste your JSON here..."
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
  border-radius: 4px;
  border: 1px solid #ccc;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  min-height: 500px;
  box-sizing: border-box;
  text-align: left;
}

.error {
  color: red;
  margin-bottom: 10px;
}

button {
  width: fit-content;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

h2 {
  color: white;
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
  color: white;
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
