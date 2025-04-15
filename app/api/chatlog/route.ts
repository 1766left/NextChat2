import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { getServerSideConfig } from "../../config/server";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { sessionId, userMessage, botMessage, timestamp, userName } = body;

    console.log("[Chat Log]", {
      sessionId,
      userMessage,
      botMessage,
      timestamp,
      userName,
    });

    // 获取 Notion 配置
    const config = getServerSideConfig();
    if (!config.notionApiKey || !config.notionDatabaseId) {
      console.log("[Chat Log] Notion configuration not found");
      return NextResponse.json({ success: true });
    }

    // 初始化 Notion 客户端
    const notion = new Client({ auth: config.notionApiKey });

    // 创建新的数据库条目
    await notion.pages.create({
      parent: { database_id: config.notionDatabaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `HAI`,
              },
            },
          ],
        },
        用户消息: {
          rich_text: [
            {
              text: {
                content: userMessage.slice(0, 100),
              },
            },
          ],
        },
        机器人回复: {
          rich_text: [
            {
              text: {
                content: botMessage.slice(0, 100),
              },
            },
          ],
        },
        时间: {
          date: {
            start: new Date(timestamp).toISOString(),
          },
        },
        SessionId: {
          rich_text: [
            {
              text: {
                content: sessionId,
              },
            },
          ],
        },
        用户名: {
          rich_text: [
            {
              text: {
                content: userName,
              },
            },
          ],
        },
      },
      children: [
        {
          heading_1: {
            rich_text: [
              {
                text: {
                  content: "用户消息",
                },
              },
            ],
          },
          type: "heading_1" as const,
        },
        ...splitTextIntoBlocks(userMessage).map((text) => ({
          paragraph: {
            rich_text: [
              {
                text: {
                  content: text,
                },
              },
            ],
          },
          type: "paragraph" as const,
        })),
        {
          heading_1: {
            rich_text: [
              {
                text: {
                  content: "机器人回复",
                },
              },
            ],
          },
          type: "heading_1" as const,
        },
        ...splitTextIntoBlocks(botMessage).map((text) => ({
          paragraph: {
            rich_text: [
              {
                text: {
                  content: text,
                },
              },
            ],
          },
          type: "paragraph" as const,
        })),
      ].slice(0, 100), // 限制最多100个block
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Log] Error:", error);
    return NextResponse.json({ error: "Failed to log chat" }, { status: 500 });
  }
};

// 将文本拆分为合理的块，确保每块不超过2000字符，且不打断标题
function splitTextIntoBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentBlock = "";

  for (const line of lines) {
    // 如果是标题（以#开头）或当前块+新行超过2000字符，则开始新块
    if (
      line.trim().startsWith("#") ||
      currentBlock.length + line.length + 1 > 1500
    ) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = line;
    } else {
      // 否则将行添加到当前块
      currentBlock = currentBlock ? `${currentBlock}\n${line}` : line;
    }
  }

  // 添加最后一个块
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}
