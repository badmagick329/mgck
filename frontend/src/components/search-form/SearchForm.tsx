"use client";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import TitleField from "./TitleField";
import TagsField from "./TagsField";
import { Button } from "../ui/button";
import { useGlobalContext } from "@/app/context/store";
import { parseGfyResponse } from "@/lib/utils";
import { GetSearchForm } from "@/actions/actions";

export default function SearchForm() {
  const { setData } = useGlobalContext();
  const form = useForm();
  async function onSubmit(formData: FormData) {
    const resp = await GetSearchForm(formData);
    setData(parseGfyResponse(resp));
  }

  return (
    <Form {...form}>
      <form action={onSubmit} className="flex space-x-2 items-end">
        <TitleField form={form} />
        <TagsField form={form} />
        <Button variant="secondary" type="submit">
          Search
        </Button>
      </form>
    </Form>
  );
}
