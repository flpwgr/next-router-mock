import { MemoryRouter } from "./MemoryRouter";

describe("MemoryRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  [{ async: false }, { async: true }].forEach(({ async }) => {
    describe(async ? "async mode" : "sync mode", () => {
      const memoryRouter = new MemoryRouter();
      memoryRouter.async = async;

      it("should start empty", async () => {
        expect(memoryRouter).toMatchObject({
          asPath: "",
          pathname: "",
          query: {},
          locale: undefined,
        });
      });
      it("pushing URLs should update the route", async () => {
        await memoryRouter.push(`/one/two/three`);

        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three",
          pathname: "/one/two/three",
          query: {},
        });

        await memoryRouter.push(`/one/two/three?four=4&five=`);

        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three?four=4&five=",
          pathname: "/one/two/three",
          query: {
            five: "",
            four: "4",
          },
        });
      });

      describe("routeChangeStart and routeChangeComplete events", () => {
        const routeChangeStart = jest.fn();
        const routeChangeComplete = jest.fn();
        beforeAll(() => {
          memoryRouter.events.on("routeChangeStart", routeChangeStart);
          memoryRouter.events.on("routeChangeComplete", routeChangeComplete);
        });
        afterAll(() => {
          memoryRouter.events.off("routeChangeStart", routeChangeStart);
          memoryRouter.events.off("routeChangeComplete", routeChangeComplete);
        });

        it("should both be triggered when pushing a URL", async () => {
          await memoryRouter.push("/one");
          expect(routeChangeStart).toHaveBeenCalledWith("/one", {
            shallow: false,
          });
          expect(routeChangeComplete).toHaveBeenCalledWith("/one", {
            shallow: false,
          });
        });

        if (async) {
          it("should both be triggered in the correct async order", async () => {
            const promise = memoryRouter.push("/one/two/three");
            expect(routeChangeStart).toHaveBeenCalledWith("/one/two/three", {
              shallow: false,
            });
            expect(routeChangeComplete).not.toHaveBeenCalled();
            await promise;
            expect(routeChangeComplete).toHaveBeenCalledWith("/one/two/three", {
              shallow: false,
            });
          });
        }

        it("should be triggered when pushing a URL Object", async () => {
          await memoryRouter.push({
            pathname: "/one/two",
            query: { foo: "bar" },
          });
          expect(routeChangeStart).toHaveBeenCalled();
          expect(routeChangeStart).toHaveBeenCalledWith("/one/two?foo=bar", {
            shallow: false,
          });
          expect(routeChangeComplete).toHaveBeenCalledWith("/one/two?foo=bar", {
            shallow: false,
          });
        });

        it("should be triggered when replacing", async () => {
          await memoryRouter.replace("/one/two/three");
          expect(routeChangeStart).toHaveBeenCalled();
          expect(routeChangeStart).toHaveBeenCalledWith("/one/two/three", {
            shallow: false,
          });
          expect(routeChangeComplete).toHaveBeenCalledWith("/one/two/three", {
            shallow: false,
          });
        });

        it("should provide the 'shallow' value", async () => {
          await memoryRouter.push("/test", undefined, { shallow: true });
          expect(routeChangeStart).toHaveBeenCalled();
          expect(routeChangeStart).toHaveBeenCalledWith("/test", {
            shallow: true,
          });
          expect(routeChangeComplete).toHaveBeenCalledWith("/test", {
            shallow: true,
          });
        });
      });

      it("pushing UrlObjects should update the route", async () => {
        await memoryRouter.push({ pathname: "/one" });
        expect(memoryRouter).toMatchObject({
          asPath: "/one",
          pathname: "/one",
          query: {},
        });

        await memoryRouter.push({
          pathname: "/one/two/three",
          query: { four: "4", five: "" },
        });
        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three?four=4&five=",
          pathname: "/one/two/three",
          query: {
            five: "",
            four: "4",
          },
        });
      });
      it("pushing UrlObjects should inject slugs", async () => {
        await memoryRouter.push({
          pathname: "/one/[id]",
          query: { id: "two" },
        });
        expect(memoryRouter).toMatchObject({
          asPath: "/one/two",
          pathname: "/one/[id]",
          query: {
            id: "two",
          },
        });

        await memoryRouter.push({
          pathname: "/one/[id]/three",
          query: { id: "two" },
        });
        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three",
          pathname: "/one/[id]/three",
          query: {
            id: "two",
          },
        });

        await memoryRouter.push({
          pathname: "/one/[id]/three",
          query: { id: "two", four: "4" },
        });
        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three?four=4",
          pathname: "/one/[id]/three",
          query: {
            four: "4",
            id: "two",
          },
        });
        await memoryRouter.push({
          pathname: "/one/[id]/three/[four]",
          query: { id: "two", four: "4" },
        });
        expect(memoryRouter).toMatchObject({
          asPath: "/one/two/three/4",
          pathname: "/one/[id]/three/[four]",
          query: {
            four: "4",
            id: "two",
          },
        });
      });
      it("push the locale", async () => {
        await memoryRouter.push("/", undefined, { locale: "en" });
        expect(memoryRouter).toMatchObject({
          locale: "en",
        });
      });

      it("should support the locales property", async () => {
        expect(memoryRouter.locales).toEqual([]);
        memoryRouter.locales = ["en", "fr"];
        expect(memoryRouter.locales).toEqual(["en", "fr"]);
      });

      it("prefetch should do nothing", async () => {
        expect(await memoryRouter.prefetch()).toBeUndefined();
      });

      it("should apply the pathParser function if provided", async () => {
        memoryRouter.setPathParser((url) => {
          const parts = url.split("/");
          return {
            one: parts[0],
            two: parts[1],
            three: parts[2]
          }
        });

        await memoryRouter.push("first/second/third")
        expect(memoryRouter).toMatchObject({
          query: {
            one: "first",
            two: "second",
            three: "third"
          }
        });
      });

      it("when query string is present, should merge with path parser output", async () => {
        memoryRouter.setPathParser((url) => {
          const parts = url.split("/");
          return {
            one: parts[0],
            two: parts[1],
            three: parts[2]
          }
        });

        await memoryRouter.push("first/second/third?paramOne=true&paramTwo=false");
        expect(memoryRouter).toMatchObject({
          query: {
            paramOne: "true",
            paramTwo: "false",
            one: "first",
            two: "second",
            three: "third"
          }
        });
      });

      it("when query string key collides with parsed key, will take query string value", async () => {
        memoryRouter.setPathParser((url) => {
          const parts = url.split("/")
          return {
            one: parts[0],
            two: parts[1]
          }
        });

        await memoryRouter.push("first/second?paramOne=true&two=false")
        expect(memoryRouter).toMatchObject({
          query: {
            one: "first",
            two: "false",
            paramOne: "true"
          }
        });
      });

      it("when dynamic path registered will parse variables from slug", async () =>  {
        memoryRouter.registerPaths(["/entity/[id]/attribute/[name]", "/[...slug]"]);

        await memoryRouter.push("/entity/101/attribute/everything");
        expect(memoryRouter).toMatchObject({
          pathname: "/entity/101/attribute/everything",
          asPath: "/entity/101/attribute/everything",
          query: {
            id: "101",
            name: "everything"
          }
        });
      });

      it("when catch-all dynamic path registered will parse variables from slug", async () => {
        memoryRouter.registerPaths(["/entity/[id]/attribute/[name]", "/[...slug]"])

        await memoryRouter.push("/one/two/three")
        expect(memoryRouter).toMatchObject({
          pathname: "/one/two/three",
          asPath: "/one/two/three",
          query: {
            slug: ["one", "two", "three"]
          }
        });
      });

      it("when no dynamic path matches, will not parse query from slug", async () => {
        memoryRouter.registerPaths(["/entity/[id]/attribute/[name]"])

        await memoryRouter.push("/one/two/three")
        expect(memoryRouter).toMatchObject({
          pathname: "/one/two/three",
          asPath: "/one/two/three",
          query: {}
        });
      });
    });
  });
});
