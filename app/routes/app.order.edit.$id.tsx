import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Card,
  Tag,
  TextField,
  BlockStack,
  Button,
  Toast,
  Frame,
} from "@shopify/polaris";

export const action = async ({
  request,
  params,
}: {
  request: any;
  params: any;
}) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  const adds = body.get("adds");
  const removes = body.get("removes");
  const response = await admin.graphql(`
  mutation {
    tagsAdd(id: "gid://shopify/Order/${params.id}", tags: [${adds.split(",").map((tag: string) => `"${tag}"`)}]) {
      userErrors {
        field
        message
      }
    }

    tagsRemove(id: "gid://shopify/Order/${params.id}", tags: [${removes.split(",").map((tag: string) => `"${tag}"`)}]) {
      userErrors {
        field
        message
      }
    }
  }`);

  const data = await response.json();
  return json({
    data,
    adds: adds === "" ? undefined : adds.split(","),
    removes: removes === "" ? undefined : removes.split(","),
  });
};

export async function loader({
  request,
  params,
}: {
  request: any;
  params: any;
}) {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
      order(id: "gid://shopify/Order/${params.id}") {
        id
        tags
        name
        totalPriceSet {
          presentmentMoney {
            amount
          }
        }
        lineItems(first: 10) {
          nodes {
            id
            name
          }
        }
        customer {
          id
          displayName
          email
        }
      }
    }`);

  const {
    data: { order },
  } = await response.json();

  return json({ order, params });
}

export default function Edit() {
  const actionResponse: any = useActionData();
  const {
    order,
  }: { order: { tags: string[]; name: string }; params: { id: string } } =
    useLoaderData();

  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("false");
  const [tags, setTags] = useState<string[]>(order.tags);

  const [tagsToAdd, setTagToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const toggleActive = useCallback(
    () => setToastActive((active) => !active),
    [],
  );

  useEffect(() => {
    if (actionResponse) {
      const {
        data: {
          data: { tagsAdd, tagsRemove },
        },
        adds,
        removes,
      } = actionResponse;
      if (
        tagsAdd.userErrors.length === 0 ||
        tagsRemove.userErrors.length === 0
      ) {
        toggleActive();
        const message = "Tags updated successfully," +
        (adds ? `Added: ${adds}` : '') +
        (removes ? ` Removed: ${removes}` : '')
        setToastMessage(message);
        setTagToAdd([]);
        setTagsToRemove([]);
      }
    }
  }, [actionResponse]);

  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      setTagToAdd([...tagsToAdd, tagInput.trim()]);
    }
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = [...tags];
    const remove = updatedTags.splice(index, 1);
    setTags(updatedTags);
    setTagsToRemove([...tagsToRemove, remove[0]]);
  };

  return (
    <Frame>
      <Page title={`Edit Tag for Order ${order.name}`}>
        <Card>
          <div style={{ lineHeight: "32px" }}>
            <div>Tags: </div>
            {tags.map((tag, index) => (
              <>
                <Tag key={index} onRemove={() => handleRemoveTag(index)}>
                  {tag}
                </Tag>
                &nbsp;&nbsp;&nbsp;
              </>
            ))}
          </div>
          <Form method="post">
            <BlockStack gap="500">
              <br />
              <input
                type="hidden"
                name="removes"
                value={tagsToRemove.join(",")}
              />
              <input type="hidden" name="adds" value={tagsToAdd.join(",")} />
              <TextField
                label="Add New Tags:"
                value={tagInput}
                onChange={(value) => setTagInput(value)}
                autoComplete="off"
              />
              <Button onClick={handleAddTag}>Add Tag</Button>
              <Button
                variant="primary"
                submit
                disabled={tagsToAdd.length === 0 && tagsToRemove.length === 0}
              >
                Save
              </Button>
            </BlockStack>
          </Form>
        </Card>
        {toastActive ? (
          <Toast content={toastMessage} onDismiss={toggleActive} />
        ) : null}
      </Page>
    </Frame>
  );
}
