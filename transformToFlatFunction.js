function transformToFlat(input) {
    var result = { data: [] };

    for (var i = 0; i < input.WorkCenter.length; i++) {
        result.data.push({
            workCenter: input.WorkCenter[i],
            bucketName: input.BucketName[i],
            position: input.Position[i],
            capacity: input.Capacity[i]
        });
    }

    return result;
}
