import { useCallback, useMemo, useState } from "react";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  Text,
  TextField,
  BlockStack,
  PageActions,
  Tag,
  Combobox,
  Listbox,
  AutoSelection,
  EmptySearchResult,
  InlineStack,
  Button,
} from "@shopify/polaris";

import db from "../db.server";
import type { Order } from "@prisma/client";
import type { LoaderFunctionArgs} from "@remix-run/node";
import { getOrder } from "app/models/order";
// import { authenticate } from "app/shopify.server";

export async function loader({ request, params }: LoaderFunctionArgs): Promise<any> {
  // const { admin, session } = await authenticate.admin(request);

  const order = await getOrder(String(params.id))
  // const response = await admin.graphql(`
  //   {
  //     order(id: "gid://shopify/Order/${params.id}") {
  //       id
  //       tags
  //       name
  //       totalPriceSet {
  //         presentmentMoney {
  //           amount
  //         }
  //       }
  //       lineItems(first: 10) {
  //         nodes {
  //           id
  //           name
  //         }
  //       }
  //       customer {
  //         id
  //         displayName
  //         email
  //       }
  //     }
  //   }`);

  // const {
  //   data: { order },
  // } = await response.json();

  console.log(`Order fetched by id: ${JSON.stringify({order, params})}`)

  return json({ order, params });
}

// export async function action({ request, params }: LoaderFunctionArgs) {
//   const { admin, session } = await authenticate.admin(request);
//   console.log(`ACTION request: ${JSON.stringify(request)} params: ${JSON.stringify(request)} `)
//   const response = await admin.graphql(`
//     {
//       order(id: "gid://shopify/Order/${params.id}") {
//         id
//         tags
//         name
//         totalPriceSet {
//           presentmentMoney {
//             amount
//           }
//         }
//         lineItems(first: 10) {
//           nodes {
//             id
//             name
//           }
//         }
//         customer {
//           id
//           displayName
//           email
//         }
//       }
//     }`);

//   const {
//     data: { order },
//   } = await response.json();


//   const orderFromStore = order;

//   console.log("Response data:", JSON.stringify(orderFromStore));

//   const data: any = {
//     ...Object.fromEntries(await request.formData())
//   };
//   orderFromStore.id = parseInt(data.orderId);
//   orderFromStore.tags = data.tags;
//   await orderFromStore.save({
//     update: true,
//   });

//   const updateResponse = await db.order.update({ where: { id: Number(params.id) }, data });

//   console.log("Response:", updateResponse)

//   return redirect(`/app/orders`);
// }

export default function OrderForm() {
  const orderData: any = useLoaderData();
  const orderRes = orderData.order;

  console.error('AAAAAAAAAAAAAAAAAAAAAAa', orderRes);

  const tagList = orderRes.tags ? orderRes.tags.split(",") : []
  const [formState, setFormState] = useState<Order>(orderRes);
  const [cleanFormState, setCleanFormState] = useState(orderRes);
  const [tagField, setTagField] = useState<string[]>(tagList);
  const [newTag, setNewTag] = useState<string>("");
  const [suggestion, setSuggestion] = useState('');

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  const navigate = useNavigate();

  const submit = useSubmit();

  const handleActiveOptionChange = useCallback(
    (activeOption: string) => {
      const activeOptionIsAction = activeOption === newTag;

      if (!activeOptionIsAction && !tagField.includes(activeOption)) {
        setSuggestion(activeOption);
      } else {
        setSuggestion("");
      }
    },
    [newTag, tagField],
  );
  const updateSelection = useCallback(
    (selected: string) => {
      const nextSelectedTags = new Set([...tagField]);

      if (nextSelectedTags.has(selected)) {
        nextSelectedTags.delete(selected);
      } else {
        nextSelectedTags.add(selected);
      }
      setTagField([...nextSelectedTags]);
      setFormState({ ...formState, tags: [...nextSelectedTags].join(",") })
      setNewTag("");
      setSuggestion("");
    },
    [formState, tagField],
  );

  const removeTag = useCallback(
    (tag: string) => () => {
      updateSelection(tag);
    },
    [updateSelection],
  );

  const getAllTags = useCallback(() => {
    return [...tagField].sort();
  }, [tagField]);

  const formatOptionText = useCallback(
    (option: string) => {
      const trimValue = newTag.trim().toLocaleLowerCase();
      const matchIndex = option.toLocaleLowerCase().indexOf(trimValue);

      if (!newTag || matchIndex === -1) return option;

      const start = option.slice(0, matchIndex);
      const highlight = option.slice(matchIndex, matchIndex + trimValue.length);
      const end = option.slice(matchIndex + trimValue.length, option.length);

      return (
        <p>
          {start}
          <Text fontWeight="bold" as="span">
            {highlight}
          </Text>
          {end}
        </p>
      );
    },
    [newTag],
  );

  const escapeSpecialRegExCharacters = useCallback(
    (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    [],
  );

  const options = useMemo(() => {
    let list;
    const allTags = getAllTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(newTag), 'i');

    if (newTag) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [newTag, getAllTags, escapeSpecialRegExCharacters]);

  const optionMarkup =
    options.length > 0
      ? options.map((option) => {
          return (
            <Listbox.Option
              key={option}
              value={option}
              selected={tagField.includes(option)}
              accessibilityLabel={option}
            >
              <Listbox.TextOption selected={tagField.includes(option)}>
                {formatOptionText(option)}
              </Listbox.TextOption>
            </Listbox.Option>
          );
        })
      : null;

  const noResults = newTag && !getAllTags().includes(newTag);

  const actionMarkup = noResults ? (
    <Listbox.Action value={newTag}>{`Add "${newTag}"`}</Listbox.Action>
  ) : null;

  const emptyStateMarkup = optionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${newTag}"`}
    />
  );

  const listboxMarkup =
    optionMarkup || actionMarkup || emptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateSelection}
        onActiveOptionChange={handleActiveOptionChange}
      >
        {actionMarkup}
        {optionMarkup}
      </Listbox>
    ) : null;

  const tagMarkup = tagField.length > 0 ? tagField.map((option) => (
    <Tag onRemove={removeTag(option)} key={option}>{option}</Tag>
  )): null;

  const handleSave = () => {
    const data = {
      orderId: formState.orderId,
      tags: formState.tags || "",
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar title="Edit Tag Order">
        <button variant="breadcrumb" onClick={() => navigate("/app/orders")}>
          Orders
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Order ID
                </Text>
                <TextField
                  id="orderId"
                  label="Order ID"
                  labelHidden
                  autoComplete="off"
                  value={formState.orderId}
                  disabled
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Order Number
                </Text>
                <TextField
                  id="orderNumber"
                  label="Order Number"
                  labelHidden
                  autoComplete="off"
                  value={formState.orderNumber?.toString()}
                  disabled
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Tags
                </Text>
                <InlineStack gap="100">
                  {tagMarkup}
                </InlineStack>
                <Combobox
                  allowMultiple
                  activator={
                    <Combobox.TextField
                      id="tag"
                      autoComplete="off"
                      label="Search tags"
                      labelHidden
                      value={newTag}
                      suggestion={suggestion}
                      placeholder="Search tags"
                      onChange={setNewTag}
                    />
                  }
                >
                  {listboxMarkup}
                </Combobox>
              </BlockStack>
            </Card>
          </BlockStack>
          <PageActions
            primaryAction={{
              content: "Save",
              loading: isSaving,
              disabled: !isDirty || isSaving,
              onAction: handleSave,
            }}
            secondaryActions={<Button onClick={() => navigate("/app/orders")}>Close</Button>}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
