<template>
  <div  @dragover.prevent @drop.prevent="handleDrop">
    <div class="select_folder">
    <h1 class="select_folder_title">选择文件夹</h1>
    <div class="select_folder_content">
      <a-button type="primary" @click="selectFolder">选择文件夹</a-button>
      <a-input placeholder="请选择文件夹" disabled v-model:value="folderPath" />
    </div>
  </div>
  <div class="group_settings">
    <h1 class="group_settings_title">分组设置</h1>
    <div class="group_settings_size">
      <p class="group_settings_size_title">分组步长</p>
      <a-input
        class="group_settings_size_input"
        placeholder="请输入分组步长"
        :defaultValue="groupSet.step"
        v-model:value="groupSet.step"
      />
    </div>
    <div class="group_settings_num">
      <p class="group_settings_num_title">目标文件夹数</p>
      <a-input
        class="group_settings_num_input"
        placeholder="请输入目标文件夹数"
        :defaultValue="groupSet.folderCount"
        v-model:value="groupSet.folderCount"
      />
    </div>
  </div>
  <div class="submit_btn">
    <a-button type="primary" block @click="handleGroup">开始分组</a-button>
  </div>
  </div>
  
</template>
<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
const folderPath = ref<string>("");
type groupSet = {
  step: string;
  folderCount: string;
};
const groupSet: groupSet = reactive({
  step: "1",
  folderCount: "2",
});
async function selectFolder() {
  const result = await window.electronAPI.selectFolder();
  if (result) {
    folderPath.value = result;
    console.log("Selected folder:", folderPath.value);
    
    message.success("选择成功");
  } else {
    message.warning("取消选择");
  }
}

async function handleGroup() {
  try {

    const success = await window.electronAPI.groupFiles(
      folderPath.value,
      groupSet.step,
      groupSet.folderCount
    );
    if (success) {
      message.success("分组完成！");
    } else {
      message.error("分组失败！");
    }
  } catch (err) {
    console.error(err);
    message.error("执行异常");
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const items = event.dataTransfer?.items;
  if (items && items.length > 0) {
    const item = items[0];
    if (item.kind === "file" && item.webkitGetAsEntry()?.isDirectory) {
      
      const file = item.getAsFile();
     
      if (!file) {
        message.error("无法获取文件信息");
        return;
      }
       const path = file.path
       console.log("Drop event triggered",item, file);
      if (path) {
        folderPath.value = path;
        message.success("文件夹已选择");
      }
    } else {
      message.error("请拖拽一个文件夹");
    }
  }
 
};
</script>
<style scoped lang="scss">
.select_folder {
  margin-bottom: 32px;
  text-align: left;
  &_title {
    font-size: 20px;
  }
  &_content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
}
.group_settings {
  text-align: left;
  margin-bottom: 32px;
  &_title {
    font-size: 20px;
  }
  &_size {
    &_title {
      font-size: 14px;
    }
  }
  &_num {
    &_title {
      font-size: 14px;
    }
  }
}
.submit_btn {
  margin: 0 auto;
  width: 70%;
  text-align: center;
}
</style>
