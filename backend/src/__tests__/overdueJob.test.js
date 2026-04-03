jest.mock("../services/overdueService", () => ({
  detectAndFlagOverdue: jest.fn(),
}));

const overdueService = require("../services/overdueService");
const { runOnce, startOverdueJob, stopOverdueJob } = require("../jobs/overdueJob");

describe("overdueJob", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    overdueService.detectAndFlagOverdue.mockResolvedValue(3);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    stopOverdueJob();
  });

  afterEach(() => {
    stopOverdueJob();
    console.log.mockRestore();
    console.error.mockRestore();
    jest.useRealTimers();
  });

  it("runs detection once on demand", async () => {
    const count = await runOnce();

    expect(count).toBe(3);
    expect(overdueService.detectAndFlagOverdue).toHaveBeenCalledTimes(1);
  });

  it("starts the job immediately and repeats using the configured interval", async () => {
    startOverdueJob(5000);
    await Promise.resolve();

    expect(overdueService.detectAndFlagOverdue).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(overdueService.detectAndFlagOverdue).toHaveBeenCalledTimes(2);
  });

  it("does not create duplicate intervals when started twice", async () => {
    startOverdueJob(1000);
    await Promise.resolve();
    startOverdueJob(1000);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(overdueService.detectAndFlagOverdue).toHaveBeenCalledTimes(2);
  });
});
