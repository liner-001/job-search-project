// 表单事件类型 ；副作用，比如输入框自动变高；拿到真实Dom节点
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
// 导入图标
import { ArrowUp, Loader2, Eye, EyeOff, Paperclip, X } from "lucide-react";
import { MessageOptions, FileAttachment } from "@/types/message";
import { SettingsPanel } from "./SettingsPanel";
import { useUISettings } from "@/contexts/UISettingsContext";
import { MAX_ATTACHMENTS } from "@/lib/storage/validation";
// Props类型定义  这是TS接口 定义父组件传进来的参数
interface MessageInputProps {
  // 函数 message 用户输入 opts 模型 工具 附件配置
  // 返回值Promise<void> 说明它是异步函数  ？表示可选参数
  onSendMessage: (message: string, opts?: MessageOptions) => Promise<void>;
  isLoading?: boolean;
  maxLength?: number;
}
// 定义并导出React函数组件
export const MessageInput = ({
  onSendMessage,
  isLoading = false,
  maxLength = 2000,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  // 保存设置面板是否展开<boolean>是泛型 明确状态类型是布尔值
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(false);
  // 保存附件数组  表示数组里的每一项都是FileAttachment类型
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  // 保存是否正在上传附件
  const [isUploading, setIsUploading] = useState(false);
  // useUISettings()是自定义hook 从全局Context里取配置
  // const{a,b,c} = object 这是对象解构
  const {
    hideToolMessages,
    toggleToolMessages,
    provider,
    setProvider,
    model,
    setModel,
    approveAllTools,
    setApproveAllTools,
  } = useUISettings();
  // useRef用来保存Dom引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Auto-resize textarea based on content
  // 自动调整输入高度
  useEffect(() => {
    // 拿到真实的 DOM 节点
    const textarea = textareaRef.current;
    if (textarea) {
      // 先把高度重置成自动。否则删除文字后，高度可能不会变小
      textarea.style.height = "auto";
      // 再把高度设置成内容实际需要的高度。
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [message]);
  // 文件选择事件处理函数
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 从 input 里拿文件。如果没选文件就退出
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = Math.max(0, MAX_ATTACHMENTS - attachments.length);
    if (remainingSlots <= 0) {
      alert(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // 开始上传，按钮会显示 loading
    setIsUploading(true);

    try {
      // files 原本是 FileList，不是普通数组。Array.from(files) 转成数组，再用 slice 截取允许数量
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      if (selectedFiles.length < files.length) {
        alert(
          `Only the first ${remainingSlots} file(s) were selected (max ${MAX_ATTACHMENTS} attachments).`,
        );
      }

      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        // 请求后端上传接口
        // 等上传请求返回 response 后，再继续
        // fetch(请求地址, 请求配置)POST 请求，通常用于提交数据；请求体里放的是 formData，也就是要上传的文件
        const response = await fetch("/api/agent/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        // 后端返回的数据本质上是一段文本，浏览器拿到时，它还不是 JS 对象，只是响应体里的数据流， 等 response body 解析成 JSON 后，解析后变成对象
        const data = await response.json();
        return {

          url: data.url,
          key: data.key,
          name: data.name,
          type: data.type,
          size: data.size,
        } as FileAttachment;
      });
      // 多个文件并发上传，等全部完成再把它们放进 attachment
      const uploadedFiles = await Promise.all(uploadPromises);
      // 把新附件追加到旧附件列表。
      // 展开运算符，合并两个数组
      // 函数式更新，避免拿到过期状态
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("File upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  // 根据附件 key 删除附件，会返回一个新数组，只保留不等于目标 key 的附件
  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((att) => att.key !== key));
  };

  const handleSubmit = async (e: FormEvent) => {
    // 阻止表单默认刷新页面。因为这是聊天发送，不希望浏览器刷新
    e.preventDefault();
    // 如果消息为空，并且没有附件，不发送；如果当前正在生成回复，也不发送
    if ((!message.trim() && attachments.length === 0) || isLoading) return;
    // 把消息交给父组件处理
    // 等父组件发送消息逻辑执行完成，再清空输入框和附件
    await onSendMessage(message, {
      model,
      provider,
      tools: [],
      approveAllTools: approveAllTools,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    // 发送成功后清空输入框和附件
    setMessage("");
    setAttachments([]);
  };
  // Calculate remaining characters
  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < maxLength * 0.1; // Less than 10% remaining
  return (
    // 表单提交时调用发送函数 className="relative"Tailwind CSS 类名。
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`relative mx-auto flex max-w-[80%] flex-col rounded-lg border transition-all duration-200 ${isFocused ? "border-blue-500 shadow-sm" : "border-gray-200"
          }`}
      >
        {/* Settings Panel */}
        <SettingsPanel
          isExpanded={settingsExpanded}
          onToggle={() => setSettingsExpanded(!settingsExpanded)}
          provider={provider}
          setProvider={setProvider}
          model={model}
          setModel={setModel}
        />

        {/* Input Section */}
        <div className="px-4 pt-4 pb-2">
          {/* File Attachments Display */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.key}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-800"
                >
                  <span className="max-w-[200px] truncate">{attachment.name}</span>
                  <span className="text-xs text-gray-500">
                    ({attachment.size < 1024 ? "<1KB" : `${(attachment.size / 1024).toFixed(0)}KB`})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.key)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={message}
            ref={textareaRef}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={"Type your message..."}
            className="max-h-[200px] min-h-[60px] w-full flex-1 resize-none overflow-auto pr-12 focus:outline-none"
            rows={1}
            aria-label="Message input"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,application/pdf,text/markdown,text/plain,.md,.markdown,.txt"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="File upload"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Character counter */}
              <div className={`text-xs ${isNearLimit ? "text-amber-500" : "text-gray-400"}`}>
                {remainingChars}/{maxLength}
              </div>

              {/* Auto-approve tools setting - always visible */}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={approveAllTools}
                  onChange={(e) => setApproveAllTools(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">Auto-approve tools</span>
              </label>

              {/* Tool messages toggle */}
              <button
                type="button"
                onClick={toggleToolMessages}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={hideToolMessages ? "Show tool messages" : "Hide tool messages"}
              >
                {hideToolMessages ? (
                  <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                )}
                <span className="text-gray-600 dark:text-gray-300">
                  {hideToolMessages ? "Show tools" : "Hide tools"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* File upload button */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading || attachments.length >= MAX_ATTACHMENTS}
                className="h-8 w-8 rounded-full p-0"
                aria-label="Attach file"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>

              {/* 发送按钮 */}
              <Button
                type="submit"
                size="sm"
                disabled={(!message.trim() && attachments.length === 0) || isLoading}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0 ${(message.trim() || attachments.length > 0) && !isLoading
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : ""
                  }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
