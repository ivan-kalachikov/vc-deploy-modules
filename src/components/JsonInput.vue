<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  error: string
}>()

const emit = defineEmits<{
  submit: [json: string]
}>()

const jsonInput = ref('')

const handleSubmit = () => {
  if (!jsonInput.value.trim()) return
  emit('submit', jsonInput.value)
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
    <button type="button" @click="handleSubmit">Load Configuration</button>
  </div>
</template>

<style scoped>
.json-input {
  margin-bottom: 20px;
}

.json-input textarea {
  width: 100%;
  margin-bottom: 10px;
}

.error {
  color: red;
  margin-bottom: 10px;
}

button {
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
</style>
