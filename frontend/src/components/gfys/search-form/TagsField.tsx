import { UseFormReturn, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type props = {
  form: UseFormReturn<FieldValues, any, undefined>;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

export default function TagsField({ form, setState }: props) {
  return (
    <FormField
      control={form.control}
      name="tags"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tags</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Tags (comma separated)"
              autoComplete="off"
              onChange={(e) => {
                setState(e.target.value);
              }}
              // defaultValue={defaultValue}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
