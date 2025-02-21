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
  margin: 0 auto;
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
  text-align: center;
}
</style>
